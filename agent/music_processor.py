"""
music_processor.py — 音频扒谱 + 简化模块

流程：
  1. 音频文件（MP3/WAV/M4A/FLAC）
     → basic-pitch 转 MIDI
  2. MIDI → music21 解析主旋律音符序列
  3. 音符序列 → LLM 简化成数字简谱 + 曲目信息

依赖（首次使用前安装）：
  pip install basic-pitch music21 pretty_midi

用法（直接调用）：
  from music_processor import transcribe_and_simplify
  result = transcribe_and_simplify("song.mp3", song_title="起风了")
  print(result["jianpu"])
"""

import os
import json
import re
import tempfile
import traceback
from pathlib import Path

from openai import OpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL


# ─── LLM 客户端 ───────────────────────────────────────────────────────────────

def _client():
    return OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL, timeout=60.0)


def _extract_json(text: str) -> dict:
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    raise ValueError(f"未找到合法 JSON：\n{text[:300]}")


# ─── 格式转换：非 WAV → WAV ───────────────────────────────────────────────────

def _convert_to_wav(audio_path: Path, output_dir: Path) -> Path:
    """把 M4A/MP3 等格式转成 WAV，优先用 pydub，回退用 ffmpeg 命令行。"""
    wav_path = output_dir / (audio_path.stem + "_converted.wav")
    if wav_path.exists():
        return wav_path

    # 方案 A：pydub（需要 ffmpeg 已安装）
    try:
        from pydub import AudioSegment
        print(f"  🔄 转换格式：{audio_path.suffix} → WAV（pydub）…")
        audio = AudioSegment.from_file(str(audio_path))
        audio.export(str(wav_path), format="wav")
        print(f"  ✅ 转换完成：{wav_path.name}")
        return wav_path
    except ImportError:
        pass
    except Exception as e:
        print(f"  ⚠️ pydub 转换失败：{e}，尝试 ffmpeg 命令行…")

    # 方案 B：直接调用 ffmpeg（需要 ffmpeg 在 PATH 里）
    import subprocess
    print(f"  🔄 转换格式：{audio_path.suffix} → WAV（ffmpeg）…")
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(audio_path), str(wav_path)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"格式转换失败，请安装 ffmpeg 或 pydub：\n"
            f"  winget install ffmpeg\n"
            f"  python -m pip install pydub\n"
            f"ffmpeg 错误：{result.stderr[-300:]}"
        )
    print(f"  ✅ 转换完成：{wav_path.name}")
    return wav_path


# ─── Step 1: 音频 → MIDI ──────────────────────────────────────────────────────

def audio_to_midi(audio_path: str, output_dir: str | None = None,
                  backend: str = "piano") -> str:
    """
    把音频转成 MIDI。
    backend:
      "piano"  — piano_transcription（专为钢琴，准确率高，推荐）
      "basic"  — basic-pitch（通用乐器，支持人声/吉他等）
    """
    audio_path = Path(audio_path).resolve()
    if not audio_path.exists():
        raise FileNotFoundError(f"找不到音频文件：{audio_path}")

    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="danny_midi_")
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 非 WAV 格式先转换
    NON_WAV = {".m4a", ".aac", ".mp3", ".ogg", ".wma", ".opus"}
    if audio_path.suffix.lower() in NON_WAV:
        audio_path = _convert_to_wav(audio_path, output_dir)

    if backend == "piano":
        midi_path = _transcribe_piano(audio_path, output_dir)
    else:
        midi_path = _transcribe_basic_pitch(audio_path, output_dir)

    print(f"  ✅ MIDI 已生成：{midi_path}")

    # 拆分成多轨 MIDI
    split_path = split_midi_tracks(midi_path)
    print(f"  🎛  多轨 MIDI：{split_path}")
    return str(split_path)


def _transcribe_piano(audio_path: Path, output_dir: Path) -> Path:
    """用 piano_transcription 转录（钢琴专用，准确率高）"""
    try:
        from piano_transcription_inference import PianoTranscription, sample_rate
    except ImportError:
        raise ImportError(
            "请先安装 piano_transcription_inference：\n"
            "  pip install piano_transcription_inference\n"
            "（首次运行会下载约 130MB 模型）"
        )

    print(f"  🎹 [piano_transcription] 正在转录钢琴音频…")
    midi_path = output_dir / f"{audio_path.stem}_piano.mid"

    # 用 librosa.load 替代 piano_transcription 的 load_audio（兼容新版 librosa）
    import librosa
    import numpy as np
    audio, _ = librosa.load(str(audio_path), sr=sample_rate, mono=True)
    audio = audio.astype(np.float32)

    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  💻 使用设备：{device.upper()}")
    transcriptor = PianoTranscription(device=device, checkpoint_path=None)
    transcriptor.transcribe(audio, str(midi_path))
    return midi_path


def _transcribe_basic_pitch(audio_path: Path, output_dir: Path) -> Path:
    """用 basic-pitch 转录（通用乐器）"""
    try:
        from basic_pitch.inference import predict_and_save
        from basic_pitch import build_icassp_2022_model_path, FilenameSuffix
        ICASSP_2022_MODEL_PATH = build_icassp_2022_model_path(FilenameSuffix.onnx)
    except ImportError:
        raise ImportError(
            "请先安装 basic-pitch 和 onnxruntime：\n"
            "  pip install basic-pitch onnxruntime\n"
        )

    print(f"  🎵 [basic-pitch] 正在转录音频…")
    predict_and_save(
        audio_path_list=[str(audio_path)],
        output_directory=str(output_dir),
        save_midi=True,
        sonify_midi=False,
        save_model_outputs=False,
        save_notes=False,
        model_or_model_path=ICASSP_2022_MODEL_PATH,
    )

    midi_path = output_dir / f"{audio_path.stem}_basic_pitch.mid"
    if not midi_path.exists():
        midis = list(output_dir.glob("*.mid")) + list(output_dir.glob("*.midi"))
        if not midis:
            raise FileNotFoundError(f"MIDI 文件未生成：{output_dir}")
        midi_path = midis[0]
    return midi_path


# ─── 单轨 → 多轨拆分 ──────────────────────────────────────────────────────────

def split_midi_tracks(midi_path) -> Path:
    """
    把 basic-pitch 输出的单轨 MIDI 按音域拆成 3 条轨道：
      Track 0 — Bass      (< C4, MIDI < 60)
      Track 1 — Melody    (C4–B5, MIDI 60–83)  ← 主旋律在这里
      Track 2 — High      (>= C6, MIDI >= 84)
    输出文件名加 _split 后缀，保存在同一目录。
    """
    try:
        import pretty_midi
    except ImportError:
        print("  ⚠️ pretty_midi 未安装，跳过多轨拆分")
        return Path(midi_path)

    midi_path = Path(midi_path)
    pm = pretty_midi.PrettyMIDI(str(midi_path))

    # 三个目标 instrument
    bass    = pretty_midi.Instrument(program=0, name="Bass below C4")
    melody  = pretty_midi.Instrument(program=0, name="Melody C4 to B5")
    high    = pretty_midi.Instrument(program=0, name="High above C6")

    for instrument in pm.instruments:
        for n in instrument.notes:
            if n.pitch < 60:
                bass.notes.append(n)
            elif n.pitch < 84:
                melody.notes.append(n)
            else:
                high.notes.append(n)

    out = pretty_midi.PrettyMIDI()
    out.instruments.extend([bass, melody, high])

    split_path = midi_path.parent / (midi_path.stem + "_split.mid")
    out.write(str(split_path))
    return split_path


# ─── Step 2: MIDI → 音符序列 ──────────────────────────────────────────────────

def midi_to_note_sequence(midi_path: str, max_notes: int = 80) -> dict:
    """
    用 music21 解析 MIDI，提取主旋律音符序列。
    返回：
      {
        "notes": ["C4", "D4", "E4", ...],      # 音名
        "numbers": ["1", "2", "3", ...],        # 数字简谱（C调）
        "durations": [0.5, 0.5, 1.0, ...],     # 时值（拍数）
        "tempo": 120,                            # BPM（估算）
        "key": "C major",                        # 调性
        "time_signature": "4/4",
      }
    """
    try:
        import music21
        from music21 import converter, stream, note, chord, tempo, meter, key as m21key
    except ImportError:
        raise ImportError("请先安装 music21：\n  pip install music21")

    print(f"  🎼 正在解析 MIDI…")
    score = converter.parse(midi_path)

    # ── 提取调性 ──────────────────────────────────────────
    key_sig = score.analyze("key")
    key_name = str(key_sig) if key_sig else "C major"

    # music21 v9+ 用 flatten() 替代 flat
    flat = score.flatten()

    # ── 提取拍号 ──────────────────────────────────────────
    ts_obj = flat.getElementsByClass(meter.TimeSignature)
    time_sig = str(ts_obj[0]) if ts_obj else "4/4"

    # ── 提取速度 ──────────────────────────────────────────
    mm_marks = flat.getElementsByClass(tempo.MetronomeMark)
    bpm = int(mm_marks[0].number) if mm_marks else 120

    # ── 旋律提取：用 pretty_midi 读 velocity，取每个时间窗口最响的音 ──
    import pretty_midi
    from music21.pitch import Pitch

    pm = pretty_midi.PrettyMIDI(midi_path)

    # 收集所有音符：(start_time, pitch_midi, velocity, duration_sec)
    raw = []
    for inst in pm.instruments:
        if inst.is_drum:
            continue
        for n in inst.notes:
            dur_sec = n.end - n.start
            if dur_sec < 0.08:        # 过滤极短噪音
                continue
            raw.append((n.start, n.pitch, n.velocity, dur_sec))

    raw.sort(key=lambda x: x[0])

    # 时间窗口内只保留 velocity 最高的音（最响 = 主旋律）
    WIN = 0.12   # 秒，同一窗口判定阈值
    buckets = []
    for start, pitch, vel, dur in raw:
        if buckets and start - buckets[-1][0] < WIN:
            if vel > buckets[-1][2]:  # 更响就替换
                buckets[-1] = (start, pitch, vel, dur)
        else:
            buckets.append((start, pitch, vel, dur))
        if len(buckets) >= max_notes:
            break

    # ── 移调到 C 大调（简谱不处理升降号，初学者友好）────────────
    # 计算原调主音到 C 的半音距离
    if key_sig:
        tonic_midi = key_sig.tonic.midi % 12   # 0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B
        # 小调移调到 A 小调再算（等效 C 大调指法）
        if key_sig.mode == "minor":
            tonic_midi = (tonic_midi + 3) % 12  # 小调主音 → 对应大调
        # 选最近的移调方向（不超过 ±6 个半音）
        semitones = -tonic_midi if tonic_midi <= 6 else (12 - tonic_midi)
        original_key = key_name
        key_name = "C major（已移调）"
    else:
        semitones = 0
        original_key = "未知"

    if semitones != 0:
        print(f"  🎵 移调 {'+' if semitones > 0 else ''}{semitones} 个半音：{original_key} → C major")

    # 把 MIDI pitch 转成 music21 Pitch 对象，同时应用移调
    notes_list = []
    for start, pitch_midi, vel, dur_sec in buckets:
        transposed_midi = pitch_midi + semitones
        p = Pitch(midi=transposed_midi)
        # 把秒换算成四分音符拍数（用 bpm 估算）
        dur_beats = max(0.25, round((dur_sec / 60) * bpm * 2) / 2)
        notes_list.append((p, dur_beats))

    # ── 转数字简谱（基于 C 调）────────────────────────────
    PITCH_TO_NUMBER = {
        "C": "1", "D": "2", "E": "3", "F": "4",
        "G": "5", "A": "6", "B": "7",
    }

    note_names = []
    note_numbers = []
    durations = []

    for pitch, dur in notes_list:
        step = pitch.step  # C D E F G A B
        octave = pitch.octave
        num = PITCH_TO_NUMBER.get(step, "?")

        # 标记八度（中央C所在八度为4，低一个八度加点在下，高加点在上）
        if octave < 4:
            num = num + "·"  # 低八度（简化标注）
        elif octave > 4:
            num = "·" + num  # 高八度

        note_names.append(f"{pitch.nameWithOctave}")
        note_numbers.append(num)
        durations.append(round(dur, 2))

    print(f"  ✅ 解析完成，共 {len(note_names)} 个音符，调性：{key_name}，BPM：{bpm}")

    return {
        "notes":          note_names,
        "numbers":        note_numbers,
        "durations":      durations,
        "tempo":          bpm,
        "key":            key_name,
        "time_signature": time_sig,
    }


# ─── Step 3: LLM 简化 ─────────────────────────────────────────────────────────

SIMPLIFY_SYSTEM = """你是专业的钢琴简谱编写专家，专门为零基础电子琴/钢琴新手改编乐谱。

收到一段原始音符序列后，你需要：
1. 识别主要旋律，去掉装饰音和重复型伴奏音
2. 简化节奏（保留主要节拍点，忽略复杂切分）
3. 输出简洁的数字简谱（1-7，低八度加下标点·，高八度加上标点·）
4. 延音用 — 表示，休止用 0 表示

请直接输出如下 JSON，不要多余说明：

{
  "jianpu": "完整简化简谱，用空格分开每个音，每行约8个音，换行用\\n（示例：1 2 3 5 — 3 2 1\\n5 6 5 3 2 1）",
  "difficulty": "入门 或 简单 或 中等",
  "key": "C大调 或 G大调 等",
  "tempo_suggestion": "建议练习速度，例如：♩=60 慢速开始",
  "summary": "这段旋律的特点描述（30字以内）",
  "tips": "给新手的练习建议（50字以内）"
}"""


def llm_simplify(note_sequence: dict, song_title: str = "") -> dict:
    """
    把 MIDI 解析出的音符序列送给 LLM，返回简化版数字简谱。
    """
    numbers = note_sequence["numbers"]
    durations = note_sequence["durations"]
    key = note_sequence.get("key", "未知")
    bpm = note_sequence.get("tempo", 120)

    # 构造易于 LLM 理解的音符描述
    note_desc = []
    for num, dur in zip(numbers, durations):
        if dur >= 2:
            note_desc.append(f"{num}(延音{dur}拍)")
        elif dur <= 0.25:
            note_desc.append(f"{num}(快)")
        else:
            note_desc.append(num)

    user_msg = f"""曲目：《{song_title or '未知曲目'}》
调性：{key}
速度：约 {bpm} BPM
原始音符序列（共{len(numbers)}个音）：
{' '.join(note_desc[:80])}

请为零基础新手简化这段旋律，输出数字简谱。"""

    print(f"  🤖 正在用 LLM 简化简谱…")
    client = _client()
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=[
            {"role": "system", "content": SIMPLIFY_SYSTEM},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.5,
        max_tokens=1000,
    )
    raw = resp.choices[0].message.content
    return _extract_json(raw)


# ─── 主流程 ───────────────────────────────────────────────────────────────────

def transcribe_and_simplify(
    audio_path: str,
    song_title: str = "",
    output_dir: str | None = None,
    keep_midi: bool = False,
    backend: str = "piano",
) -> dict:
    """
    完整流程：音频文件 → 数字简谱

    参数：
      audio_path  — MP3/WAV/M4A/FLAC 路径
      song_title  — 曲目名（用于 LLM 提示）
      output_dir  — MIDI 输出目录（None = agent同级的 output/midi/）
      keep_midi   — 是否保留中间 MIDI 文件

    返回：
      {
        "jianpu": "1 2 3 5 — ...",
        "difficulty": "简单",
        "key": "C大调",
        "tempo_suggestion": "♩=60",
        "summary": "...",
        "tips": "...",
        "midi_path": "/tmp/xxx.mid",   # keep_midi=True 时有效
        "note_count": 45,
      }
    """
    print(f"\n{'='*50}")
    print(f"  🎹 开始扒谱：{Path(audio_path).name}")
    print(f"{'='*50}")

    # 默认保存到 agent 同级的 output/midi/
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "output" / "midi"
        output_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: 音频 → MIDI
    midi_path = audio_to_midi(audio_path, output_dir=str(output_dir), backend=backend)

    try:
        # Step 2: MIDI → 音符序列
        note_seq = midi_to_note_sequence(midi_path)

        # Step 3: LLM 简化
        result = llm_simplify(note_seq, song_title=song_title)

        result["note_count"] = len(note_seq["numbers"])
        result["midi_path"]  = midi_path if keep_midi else None

        if not keep_midi:
            try:
                os.remove(midi_path)
            except Exception:
                pass

        return result

    except Exception:
        # 出错时保留 MIDI 方便调试
        print(f"  ⚠️ 处理失败，MIDI 文件保留在：{midi_path}")
        raise
