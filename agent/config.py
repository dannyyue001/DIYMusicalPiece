# ═══════════════════════════════════════════════════════
#  ⚙️  配置文件 — 填完这里就能跑
# ═══════════════════════════════════════════════════════

# ① 去 https://bailian.console.aliyun.com/ 注册，创建 API Key
#    复制后填到下面引号里
QWEN_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← 改这里

# ② 模型选择（便宜→贵，能力依次提升）
#    qwen-turbo   最快最便宜，文案生成够用
#    qwen-plus    均衡，推荐日常使用
#    qwen-max     最强，复杂乐理问答用这个
QWEN_MODEL = "qwen-plus"  # ← 可改

# ③ Qwen API 地址（兼容 OpenAI 格式，不用改）
QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

# ④ 你的频道名（用于生成文案时带入人设）
CREATOR_NAME = "Danny"
CHANNEL_STYLE = "每日一首简易钢琴曲，零基础友好，数字简谱教学"
