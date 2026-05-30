# 🤖 Danny音乐馆 AI Agent

基于 Qwen API 的内容创作 + 乐理问答助手。

## 快速开始

### 1. 填写 API Key

打开 `config.py`，把 `QWEN_API_KEY` 换成你的真实 key：

```python
QWEN_API_KEY = "sk-你的key"   # ← 改这里
```

**获取 Key：** https://bailian.console.aliyun.com/  
注册 → 创建 API Key → 复制

### 2. 安装依赖

```bash
cd agent
pip install -r requirements.txt
```

### 3. 运行

```bash
python agent.py
```

---

## 四种模式

| 模式 | 用途 |
|------|------|
| **1 文案生成** | 输入曲名，一键输出抖音+小红书标题、口播稿、话题标签 |
| **2 曲目介绍** | 输入曲名，自动生成可直接粘贴到 `App.jsx` 的代码 |
| **3 乐理问答** | 多轮对话，问任何钢琴/电子琴问题 |
| **4 智能对话** | 自由输入，Agent 自动判断意图并调用对应工具 |

---

## 模型选择（在 config.py 修改）

| 模型 | 速度 | 价格 | 推荐场景 |
|------|------|------|---------|
| `qwen-turbo` | 最快 | 最低 | 文案生成、简单问答 |
| `qwen-plus`  | 均衡 | 中等 | **日常推荐** |
| `qwen-max`   | 较慢 | 较高 | 复杂乐理分析 |

---

## 文件说明

```
agent/
├── config.py        ← ⭐ 填写 API Key 的地方
├── tools.py         ← 三个工具的实现
├── agent.py         ← 主程序（运行这个）
└── requirements.txt
```
