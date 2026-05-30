"""
tools.py — Danny音乐馆 AI Agent 工具集

三个工具：
  1. generate_content      → 生成抖音/小红书文案
  2. generate_song_info    → 给曲目自动生成描述、贴士、难度
  3. answer_music_theory   → 乐理问答（直接回答，不走 tool calling）
"""

import json
from openai import OpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, CREATOR_NAME, CHANNEL_STYLE


def _client() -> OpenAI:
    return OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL)


# ─── Tool 1：短视频文案生成 ────────────────────────────────────────────────────

CONTENT_SYSTEM_PROMPT = f"""你是垂直领域钢琴教学内容创作者，账号主理人是{CREATOR_NAME}，
频道定位：{CHANNEL_STYLE}，受众零基础成人和电子琴新手。

一次同时输出【抖音版本】和【小红书版本】，严格按如下 JSON 格式返回，不要多余文字：

{{
  "douyin": {{
    "titles": ["标题1（15字内，短句抓耳）", "标题2", "标题3"],
    "script": "30秒口播稿，前3秒直接放钩子，禁止'今天我来教大家'这类废话开场",
    "hashtags": ["话题1", "话题2", "话题3", "话题4", "话题5"]
  }},
  "xiaohongshu": {{
    "titles": ["标题1（突出零基础、数字简谱、3分钟学会等关键词）", "标题2", "标题3"],
    "script": "60秒教学口播稿，分步清晰，突出'有手就会'",
    "body": "笔记正文（200字以内，适合同步到网站曲目介绍）",
    "hashtags": ["话题1", "话题2", "话题3", "话题4", "话题5", "话题6"]
  }}
}}

创作规则：
- 所有教学只做单手旋律+极简左手和弦，面向零基础
- 抖音：短、洗脑、听觉爽感；小红书：干货、教程感
- 标题多用数字：30秒、3分钟、5个键、单手版
- 口播开头必须有钩子
"""

def generate_content(song_title: str, difficulty: str, category: str, extra_notes: str = "") -> dict:
    """
    生成抖音+小红书双平台文案。

    参数：
        song_title:   曲目名称，如"晴天"
        difficulty:   难度，如"入门/简单/中等"
        category:     分类，如"流行歌曲/经典纯音乐/儿歌启蒙/电子琴专属"
        extra_notes:  补充说明，如"副歌重点练习"（可留空）

    返回：dict，包含 douyin 和 xiaohongshu 两个 key
    """
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
        response_format={"type": "json_object"},
        temperature=0.85,
    )
    raw = resp.choices[0].message.content
    return json.loads(raw)


# ─── Tool 2：曲谱介绍自动生成 ─────────────────────────────────────────────────

SONG_INFO_SYSTEM_PROMPT = """你是钢琴教程撰稿人，专门为零基础电子琴/钢琴新手写曲目介绍。
使用数字简谱体系（1234567），语言通俗，不用复杂乐理术语。

严格按如下 JSON 格式返回，不要多余文字：

{
  "description": "一句话曲目介绍，说明风格、适合人群（40字以内）",
  "difficulty": "入门 或 简单 或 中等",
  "difficulty_reason": "难度评级理由（一句话）",
  "suitable_for": "适合什么人练（15字以内）",
  "tips": "练习小贴士，给零基础学习者的具体建议（60字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}

难度标准：
- 入门：只用 5-6 个音，节奏简单，单手就能完成，5分钟能上手
- 简单：单手旋律为主，偶尔左手简单和弦，15分钟能完整弹下来
- 中等：左右手需要配合，有跨八度或变速，需要持续练习
"""

def generate_song_info(song_title: str, brief: str = "") -> dict:
    """
    给曲目自动生成 App.jsx 所需的所有字段。

    参数：
        song_title: 曲目名称
        brief:      可选背景说明，如"周杰伦歌曲，主旋律有大量跳音"

    返回：dict，包含 description / difficulty / tips / tags 等字段
    """
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
        response_format={"type": "json_object"},
        temperature=0.6,
    )
    return json.loads(resp.choices[0].message.content)


# ─── Tool 3：乐理问答 ─────────────────────────────────────────────────────────

MUSIC_QA_SYSTEM_PROMPT = """你是零基础钢琴/电子琴 AI 助教，只面向完全不会弹琴的新手。

规则：
1. 语言通俗，禁止晦涩术语，必须用术语时立刻附大白话解释
2. 只讲简化版本，不提供复杂原版演奏方案
3. 全程使用数字简谱 1234567 讲解，不输出五线谱内容
4. 回答结构清晰，分点说明，每段控制 200 字以内
5. 用户问某首歌时，主动给出简化练习建议和练习顺序
6. 用户求完整曲谱时，提示去网站曲谱专区查看
"""

def answer_music_theory(question: str, history: list[dict] | None = None) -> str:
    """
    回答乐理/练琴相关问题，支持多轮对话。

    参数：
        question: 用户当前问题
        history:  历史对话列表，格式 [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]

    返回：str，助教回答
    """
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


# ─── Tool 定义（供 agent.py 的 tool calling 使用）────────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "generate_content",
            "description": "生成抖音和小红书双平台短视频文案，包括标题、口播稿、话题标签。当用户说'帮我写文案'、'生成标题'、'写口播'时调用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "song_title":   {"type": "string", "description": "曲目名称"},
                    "difficulty":   {"type": "string", "description": "难度：入门 / 简单 / 中等"},
                    "category":     {"type": "string", "description": "分类：流行歌曲 / 经典纯音乐 / 儿歌启蒙 / 电子琴专属"},
                    "extra_notes":  {"type": "string", "description": "补充说明，可留空"},
                },
                "required": ["song_title", "difficulty", "category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_song_info",
            "description": "给一首曲目自动生成网站所需的描述、难度、练习贴士和标签。当用户说'帮我写曲目介绍'、'生成曲目信息'、'我要添加新曲目'时调用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "song_title": {"type": "string", "description": "曲目名称"},
                    "brief":      {"type": "string", "description": "背景说明，可留空"},
                },
                "required": ["song_title"],
            },
        },
    },
]

# 工具名 → 函数的映射
TOOL_FUNCTIONS = {
    "generate_content":  generate_content,
    "generate_song_info": generate_song_info,
}
