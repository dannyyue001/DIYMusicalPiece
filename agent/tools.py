"""
tools.py — Danny音乐馆 AI Agent 工具集

兼容 Hugging Face 免费推理端点（不依赖 response_format / tool_calling）。
切换到阿里云 Qwen 正式版后，这些代码同样可以直接用。
"""

import json
import re
from openai import OpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, CREATOR_NAME, CHANNEL_STYLE


def _client() -> OpenAI:
    # timeout=30: 30秒无响应就抛错，避免卡死
    return OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL, timeout=30.0)


def _extract_json(text: str) -> dict:
    """
    从模型输出中提取第一个合法 JSON 对象。
    HF 免费层不支持 response_format，模型经常在 JSON 前后加文字，这里兜底处理。
    """
    # 优先匹配 ```json ... ``` 代码块
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    # 直接找第一个 { ... }
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    raise ValueError(f"模型返回中未找到合法 JSON：\n{text[:300]}")


# ─── Tool 1：短视频文案生成 ────────────────────────────────────────────────────

CONTENT_SYSTEM_PROMPT = f"""你是垂直领域钢琴教学内容创作者，账号主理人是{CREATOR_NAME}，
频道定位：{CHANNEL_STYLE}，受众零基础成人和电子琴新手。

请直接输出如下 JSON，不要任何多余说明：

{{
  "douyin": {{
    "titles": ["标题1（15字内，短句抓耳）", "标题2", "标题3"],
    "script": "30秒口播稿，前3秒直接放钩子，禁止'今天我来教大家'这类废话开场",
    "hashtags": ["话题1", "话题2", "话题3", "话题4", "话题5"]
  }},
  "xiaohongshu": {{
    "titles": ["标题1（突出零基础/3分钟/有手就会等关键词）", "标题2", "标题3"],
    "script": "60秒教学口播稿，分步清晰",
    "body": "笔记正文（200字以内，适合同步到网站曲目介绍）",
    "hashtags": ["话题1", "话题2", "话题3", "话题4", "话题5", "话题6"]
  }}
}}

创作规则：
- 只做单手旋律+极简左手和弦，面向零基础
- 抖音：短、洗脑、听觉爽感；小红书：干货、教程感
- 标题多用数字：30秒、3分钟、5个键、单手版
- 口播开头必须有钩子，禁止废话开场
"""

def generate_content(song_title: str, difficulty: str, category: str, extra_notes: str = "") -> dict:
    """生成抖音+小红书双平台文案"""
    user_msg = f"曲目：《{song_title}》 | 难度：{difficulty} | 分类：{category}"
    if extra_notes:
        user_msg += f" | 备注：{extra_notes}"

    client = _client()
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=[
            {"role": "system", "content": CONTENT_SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.85,
        max_tokens=1200,
    )
    raw = resp.choices[0].message.content
    return _extract_json(raw)


# ─── Tool 2：曲谱介绍自动生成 ─────────────────────────────────────────────────

SONG_INFO_SYSTEM_PROMPT = """你是钢琴教程撰稿人，专为零基础电子琴/钢琴新手写曲目介绍。
使用数字简谱（1234567），语言通俗。

请直接输出如下 JSON，不要任何多余说明：

{
  "description": "一句话曲目介绍，说明风格、适合人群（40字以内）",
  "difficulty": "入门 或 简单 或 中等",
  "difficulty_reason": "难度评级理由（一句话）",
  "suitable_for": "适合什么人练（15字以内）",
  "tips": "练习小贴士，给零基础学习者的具体建议（60字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}

难度标准：
- 入门：5-6个音，节奏简单，单手即可，5分钟上手
- 简单：单手旋律为主，偶有简单和弦，15分钟完整弹下来
- 中等：左右手需配合，有跨八度或变速，需持续练习
"""

def generate_song_info(song_title: str, brief: str = "") -> dict:
    """给曲目自动生成 App.jsx 所需的所有字段"""
    user_msg = f"曲目：《{song_title}》"
    if brief:
        user_msg += f"\n背景：{brief}"

    client = _client()
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=[
            {"role": "system", "content": SONG_INFO_SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.6,
        max_tokens=600,
    )
    return _extract_json(resp.choices[0].message.content)


# ─── Tool 3：乐理问答 ─────────────────────────────────────────────────────────

MUSIC_QA_SYSTEM_PROMPT = """你是零基础钢琴/电子琴 AI 助教，只面向完全不会弹琴的新手。

规则：
1. 语言通俗，必须用术语时立刻附大白话解释
2. 只讲简化版本，不提原版复杂演奏
3. 全程使用数字简谱 1234567，不输出五线谱
4. 回答分点说明，每段控制 200 字以内
5. 用户问某首歌时，主动给出简化练习建议和顺序
"""

def answer_music_theory(question: str, history: list | None = None) -> str:
    """回答乐理/练琴问题，支持多轮对话"""
    messages = [{"role": "system", "content": MUSIC_QA_SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": question})

    client = _client()
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=800,
    )
    return resp.choices[0].message.content


# ─── 意图识别（替代 tool calling，HF 免费层更稳定）────────────────────────────

INTENT_SYSTEM = """判断用户意图，只输出以下三个词之一，不要任何其他内容：
- CONTENT   → 用户想生成短视频文案（提到"文案""标题""口播""抖音""小红书"）
- SONG_INFO → 用户想生成曲目介绍或添加新曲目（提到"曲目介绍""添加曲目""新增""描述""贴士"）
- QA        → 其他（乐理问题、练琴建议、闲聊）
"""

def classify_intent(user_input: str) -> str:
    """把用户输入分类成 CONTENT / SONG_INFO / QA"""
    client = _client()
    resp = client.chat.completions.create(
        model=QWEN_MODEL,
        messages=[
            {"role": "system", "content": INTENT_SYSTEM},
            {"role": "user",   "content": user_input},
        ],
        temperature=0,
        max_tokens=10,
    )
    intent = resp.choices[0].message.content.strip().upper()
    if "CONTENT" in intent:
        return "CONTENT"
    if "SONG_INFO" in intent:
        return "SONG_INFO"
    return "QA"


# ─── Tool schemas（供参考，agent.py 智能对话模式会用到）─────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "generate_content",
            "description": "生成抖音和小红书双平台短视频文案",
            "parameters": {
                "type": "object",
                "properties": {
                    "song_title":  {"type": "string"},
                    "difficulty":  {"type": "string"},
                    "category":    {"type": "string"},
                    "extra_notes": {"type": "string"},
                },
                "required": ["song_title", "difficulty", "category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_song_info",
            "description": "给一首曲目自动生成网站所需的描述、难度、贴士和标签",
            "parameters": {
                "type": "object",
                "properties": {
                    "song_title": {"type": "string"},
                    "brief":      {"type": "string"},
                },
                "required": ["song_title"],
            },
        },
    },
]

TOOL_FUNCTIONS = {
    "generate_content":  generate_content,
    "generate_song_info": generate_song_info,
}
