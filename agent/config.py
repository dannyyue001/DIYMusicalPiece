# ═══════════════════════════════════════════════════════
#  ⚙️  配置文件 — 填完这里就能跑
# ═══════════════════════════════════════════════════════

# ─── 当前使用：Hugging Face 免费推理（测试用）─────────────────────────────────
#
# ① 去 https://huggingface.co/settings/tokens 注册并创建 token
#    类型选 "Read" 即可，免费账号可用
#    复制后填到下面引号里
# QWEN_API_KEY = "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"  # ← 改这里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

# # ② 免费可用的 Qwen 模型（7B 免费，72B 需要 HF Pro）
# #    Qwen/Qwen2.5-7B-Instruct    ← 免费，速度快，够用
# #    Qwen/Qwen2.5-72B-Instruct   ← 免费但限速，效果更好
# QWEN_MODEL = "Qwen/Qwen2.5-7B-Instruct"  # ← 可改

# # ③ Hugging Face OpenAI 兼容端点（不用改）
# QWEN_BASE_URL = "https://api-inference.huggingface.co/v1/"


QWEN_API_KEY  = "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"
QWEN_BASE_URL = "https://api.groq.com/openai/v1/"

# ⚠️ qwen-qwq-32b 是推理模型，会先输出大量思考过程，速度极慢
# 改用下面任意一个普通模型，秒级响应：
#   llama-3.3-70b-versatile   ← 推荐，效果好，中文支持佳
#   llama-3.1-8b-instant      ← 最快，适合意图分类等简单任务
#   mixtral-8x7b-32768        ← 均衡
QWEN_MODEL = "llama-3.3-70b-versatile"



# ─── 频道信息（生成文案时用）───────────────────────────────────────────────────
CREATOR_NAME  = "Danny"
CHANNEL_STYLE = "每日一首简易钢琴曲，零基础友好，数字简谱教学"
