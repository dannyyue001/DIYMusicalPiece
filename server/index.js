/**
 * server/index.js — Groq API 代理服务器
 * 运行：node server/index.js
 * 监听：http://localhost:3001
 *
 * 前端调用 /api/chat，这里转发给 Groq，Key 不暴露给浏览器。
 */

import "dotenv/config";
import express from "express";
import cors from "cors";

const app  = express();
const PORT = process.env.PORT || 3001;

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!GROQ_KEY || GROQ_KEY === "your-key-here") {
  console.error("❌ 请在 server/.env 里填写 GROQ_API_KEY！");
  process.exit(1);
}

app.use(cors({ origin: "http://localhost:5173" }));  // 只允许本地前端
app.use(express.json());

// ── 健康检查 ──────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: GROQ_MODEL });
});

// ── 聊天代理 ──────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, temperature = 0.7, max_tokens = 800 } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 不能为空" });
  }

  console.log(`[proxy] /api/chat  msgs=${messages.length}  temp=${temperature}`);

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature, max_tokens }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("[proxy] Groq 返回错误:", data);
      return res.status(upstream.status).json({ error: data?.error?.message ?? "Groq 错误" });
    }

    res.json(data);
  } catch (err) {
    console.error("[proxy] 请求失败:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`   模型：${GROQ_MODEL}`);
  console.log(`   健康检查：http://localhost:${PORT}/api/health`);
});
