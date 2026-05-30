"""
agent.py — Danny音乐馆 AI Agent 主程序

运行方式：
    python agent.py

三种模式：
    1. 文案模式  → 输入曲目，自动输出抖音+小红书完整文案
    2. 曲目模式  → 输入曲名，自动生成 App.jsx 可直接复制的曲目对象
    3. 问答模式  → 多轮乐理问答对话
"""

import json
import re
import sys

# Windows 终端强制 UTF-8，避免中文/emoji 编码错误
# reconfigure() 比替换 stdout 安全，不会破坏 Ctrl+C
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass  # Python < 3.7 不支持，跳过
from openai import OpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL
from tools import (
    TOOL_SCHEMAS, TOOL_FUNCTIONS,
    answer_music_theory,
    generate_content,
    generate_song_info,
    classify_intent,
)

# ─── ANSI 颜色（终端输出美化）────────────────────────────────────────────────

RESET  = "\033[0m"
BOLD   = "\033[1m"
PURPLE = "\033[35m"
CYAN   = "\033[36m"
YELLOW = "\033[33m"
GREEN  = "\033[32m"
RED    = "\033[31m"
GRAY   = "\033[90m"

def c(text, color): return f"{color}{text}{RESET}"
def h(text):        return c(text, BOLD + CYAN)   # header
def label(text):    return c(text, BOLD + YELLOW)  # label
def ok(text):       return c(text, GREEN)
def dim(text):      return c(text, GRAY)


# ─── Agent loop（tool calling）────────────────────────────────────────────────

AGENT_SYSTEM = """你是 Danny音乐馆的 AI 助手，专门处理以下三类任务：
1. 生成抖音/小红书短视频文案 → 调用 generate_content 工具
2. 生成曲目网站介绍（description、difficulty、tips、tags）→ 调用 generate_song_info 工具
3. 回答钢琴/乐理问题 → 直接回答，不调用工具

判断用户意图后直接行动，不要反复确认。
如果用户没给够参数（如文案缺少难度/分类），合理推断或向用户简短追问。
"""

def run_agent_turn(messages: list[dict]) -> str:
    """
    一次 agent 推理：可能调用工具，最终返回文本回复。
    """
    client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL, timeout=30.0)

    # 第一次推理
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=messages,
        tools=TOOL_SCHEMAS,
        tool_choice="auto",
        temperature=0.7,
    )
    msg = resp.choices[0].message

    # 没有工具调用 → 直接返回
    if not msg.tool_calls:
        return msg.content

    # 有工具调用 → 执行工具，把结果送回
    tool_results = []
    for tc in msg.tool_calls:
        fn_name = tc.function.name
        fn_args = json.loads(tc.function.arguments)

        print(dim(f"  🔧 调用工具：{fn_name}({', '.join(f'{k}={repr(v)}' for k,v in fn_args.items())})"))

        fn = TOOL_FUNCTIONS.get(fn_name)
        if fn is None:
            result = {"error": f"未知工具 {fn_name}"}
        else:
            try:
                result = fn(**fn_args)
            except Exception as e:
                result = {"error": str(e)}

        tool_results.append({
            "role":         "tool",
            "tool_call_id": tc.id,
            "content":      json.dumps(result, ensure_ascii=False),
        })

    # 把 assistant 的 tool_call 消息和工具结果都加进去
    messages.append({"role": "assistant", "tool_calls": [
        {
            "id":       tc.id,
            "type":     "function",
            "function": {"name": tc.function.name, "arguments": tc.function.arguments},
        }
        for tc in msg.tool_calls
    ]})
    messages.extend(tool_results)

    # 第二次推理（让模型整理工具结果，输出最终回复）
    resp2 = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=messages,
        temperature=0.7,
    )
    return resp2.choices[0].message.content


# ─── 格式化输出工具 ───────────────────────────────────────────────────────────

def print_content_result(result: dict):
    """漂亮打印文案生成结果"""
    dy = result.get("douyin", {})
    xhs = result.get("xiaohongshu", {})

    print()
    print(h("━━━━ 抖音版本 ━━━━"))
    print(label("📌 标题（3选1）："))
    for i, t in enumerate(dy.get("titles", []), 1):
        print(f"  {i}. {t}")
    print()
    print(label("🎙 口播稿（30秒）："))
    print(f"  {dy.get('script','')}")
    print()
    print(label("# 话题标签："))
    print("  " + "  ".join(f"#{t}" for t in dy.get("hashtags", [])))

    print()
    print(h("━━━━ 小红书版本 ━━━━"))
    print(label("📌 标题（3选1）："))
    for i, t in enumerate(xhs.get("titles", []), 1):
        print(f"  {i}. {t}")
    print()
    print(label("🎙 口播稿（60秒）："))
    print(f"  {xhs.get('script','')}")
    print()
    print(label("📝 笔记正文（可同步到网站）："))
    print(f"  {xhs.get('body','')}")
    print()
    print(label("# 话题标签："))
    print("  " + "  ".join(f"#{t}" for t in xhs.get("hashtags", [])))
    print()


def print_song_info_result(result: dict, song_title: str):
    """漂亮打印曲目信息，并输出可直接粘贴到 App.jsx 的代码"""
    print()
    print(h(f"━━━━ 《{song_title}》曲目信息 ━━━━"))
    print(label("描述：") + result.get("description", ""))
    print(label("难度：") + result.get("difficulty", "") + dim(f"  （{result.get('difficulty_reason','')}）"))
    print(label("适合：") + result.get("suitable_for", ""))
    print(label("贴士：") + result.get("tips", ""))
    print(label("标签：") + " / ".join(result.get("tags", [])))

    print()
    print(h("━━━━ 复制到 App.jsx 的代码 ━━━━"))
    tags_str = ", ".join(f'"{t}"' for t in result.get("tags", []))
    next_id = "??"  # 用户自行填写
    print(f"""{dim('{')}
  id: {next_id},  {dim('← 填写下一个 id 编号')}
  title: "{song_title}",
  category: "pop",  {dim('← 按实际分类改：pop / classical / children / keyboard')}
  difficulty: "{result.get('difficulty', '')}",
  isNew: true,
  description: "{result.get('description', '')}",
  keys: "",  {dim('← 填入简谱')}
  tips: "{result.get('tips', '')}",
  tags: [{tags_str}],
{dim('},')}""")
    print()


# ─── 三种交互模式 ─────────────────────────────────────────────────────────────

def mode_content():
    """文案生成模式（结构化快速输入）"""
    print(h("\n🎤 文案生成模式"))
    print(dim("直接输入曲目信息，自动生成抖音+小红书文案\n"))

    song  = input(label("曲目名称：")).strip()
    diff  = input(label("难度 [入门/简单/中等，回车=简单]：")).strip() or "简单"
    cat   = input(label("分类 [流行/古典/儿歌/电子琴，回车=流行]：")).strip()
    notes = input(label("补充说明（可回车跳过）：")).strip()

    cat_map = {"流行": "流行歌曲", "古典": "经典纯音乐", "儿歌": "儿歌启蒙", "电子琴": "电子琴专属"}
    category = cat_map.get(cat, "流行歌曲")

    print(dim("\n  生成中..."))
    try:
        result = generate_content(song, diff, category, notes)
        print_content_result(result)
    except Exception as e:
        print(f"{RED}错误：{e}{RESET}")


def mode_song_info():
    """曲目介绍生成模式"""
    print(h("\n🎵 曲目介绍生成模式"))
    print(dim("输入曲名，自动生成可复制到 App.jsx 的代码\n"))

    song  = input(label("曲目名称：")).strip()
    brief = input(label("背景说明（可回车跳过）：")).strip()

    print(dim("\n  生成中..."))
    try:
        result = generate_song_info(song, brief)
        print_song_info_result(result, song)
    except Exception as e:
        print(f"{RED}错误：{e}{RESET}")


def mode_qa():
    """乐理问答多轮对话模式"""
    print(h("\n🎹 乐理问答模式"))
    print(dim("输入任何钢琴/电子琴问题，输入 'q' 退出\n"))

    history = []
    while True:
        q = input(c("你：", BOLD + PURPLE)).strip()
        if q.lower() in ("q", "quit", "exit", "退出"):
            break
        if not q:
            continue
        print(dim("  思考中..."))
        try:
            answer = answer_music_theory(q, history)
            print(c("\n助手：", BOLD + GREEN) + answer + "\n")
            history.append({"role": "user",      "content": q})
            history.append({"role": "assistant", "content": answer})
        except Exception as e:
            print(f"{RED}错误：{e}{RESET}")


def mode_chat():
    """
    自由对话 Agent 模式。
    用 classify_intent 代替 tool calling，兼容 HF 免费层。
    """
    print(h("\n🤖 智能对话模式"))
    print(dim("直接说你想做什么，Agent 自动判断并调用对应工具"))
    print(dim("示例：'帮我给《起风了》写文案' / '新增曲目《夜曲》' / '左手和弦怎么练'"))
    print(dim("输入 'q' 退出\n"))

    qa_history = []

    while True:
        user_input = input(c("你：", BOLD + PURPLE)).strip()
        if user_input.lower() in ("q", "quit", "exit", "退出"):
            break
        if not user_input:
            continue

        print(dim("  判断意图..."))
        try:
            intent = classify_intent(user_input)
        except Exception as e:
            print(f"{RED}意图识别失败：{e}{RESET}")
            continue

        try:
            if intent == "CONTENT":
                # 从用户输入里提取曲名（简单方式：找书名号）
                m = re.search(r"[《〈「](.+?)[》〉」]", user_input)
                song = m.group(1) if m else input(label("  请输入曲目名称：")).strip()
                diff = "简单"
                cat  = "流行歌曲"
                print(dim(f"  生成《{song}》文案中..."))
                result = generate_content(song, diff, cat)
                print_content_result(result)

            elif intent == "SONG_INFO":
                m = re.search(r"[《〈「](.+?)[》〉」]", user_input)
                song = m.group(1) if m else input(label("  请输入曲目名称：")).strip()
                print(dim(f"  生成《{song}》曲目信息中..."))
                result = generate_song_info(song)
                print_song_info_result(result, song)

            else:  # QA
                print(dim("  思考中..."))
                answer = answer_music_theory(user_input, qa_history)
                print(c("\nAgent：", BOLD + GREEN) + answer + "\n")
                qa_history.append({"role": "user",      "content": user_input})
                qa_history.append({"role": "assistant", "content": answer})

        except Exception as e:
            print(f"{RED}错误：{e}{RESET}")


# ─── 主菜单 ───────────────────────────────────────────────────────────────────

MENU = f"""
{h('═══════════════════════════════')}
{h('  🎹 Danny音乐馆 AI Agent')}
{h('═══════════════════════════════')}

  {label('1')}  生成短视频文案（抖音 + 小红书）
  {label('2')}  生成曲目介绍（复制到 App.jsx）
  {label('3')}  乐理问答（多轮对话）
  {label('4')}  智能对话（自动判断意图）
  {label('q')}  退出

"""

def main():
    # 简单检查 API key 是否已填写
    from config import QWEN_API_KEY
    if "xxx" in QWEN_API_KEY:
        print(f"{RED}⚠️  请先在 agent/config.py 里填写你的 API Key！{RESET}")
        print(dim("   HF 免费 Token：https://huggingface.co/settings/tokens"))
        print(dim("   阿里云 Qwen：  https://bailian.console.aliyun.com/"))
        sys.exit(1)

    while True:
        print(MENU)
        choice = input(label("选择模式 [1/2/3/4/q]：")).strip()
        if choice == "1":
            mode_content()
        elif choice == "2":
            mode_song_info()
        elif choice == "3":
            mode_qa()
        elif choice == "4":
            mode_chat()
        elif choice.lower() in ("q", "quit", "exit"):
            print(ok("\n再见！🎵\n"))
            break
        else:
            print(dim("  输入 1/2/3/4 或 q"))


if __name__ == "__main__":
    main()
