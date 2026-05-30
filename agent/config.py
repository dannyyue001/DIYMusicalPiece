# ═══════════════════════════════════════════════════════
#  ⚙️  配置文件 — 填完这里就能跑
#  ⚠️  不要把真实 API Key 提交到 git！
#      建议：复制一份 config_local.py 填 key，.gitignore 里加上它
# ═══════════════════════════════════════════════════════

# ─── Groq（免费，速度快）─────────────────────────────────────────────────────
# 去 https://console.groq.com 注册 → API Keys → 复制填到这里
QWEN_API_KEY  = "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"   # ← 填你的 key
QWEN_BASE_URL = "https://api.groq.com/openai/v1/"

# ⚠️ qwen-qwq-32b 是推理模型，会先输出大量思考过程，速度极慢
# 改用下面任意一个普通模型，秒级响应：
#   llama-3.3-70b-versatile   ← 推荐，效果好，中文支持佳
#   llama-3.1-8b-instant      ← 最快，适合意图分类等简单任务
QWEN_MODEL = "llama-3.3-70b-versatile"


# ─── 频道信息（生成文案时用）───────────────────────────────────────────────────
CREATOR_NAME  = "Danny"
CHANNEL_STYLE = "每日一首简易钢琴曲，零基础友好，数字简谱教学"
