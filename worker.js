/**
 * worker.js — Cloudflare Worker 入口
 *
 * 处理两类请求：
 *   POST /api/chat  → 代理到 Groq API（Key 存在 Worker Secret）
 *   其他            → 交给静态资源（dist/ 里的 React 站点）
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── API 路由 ──────────────────────────────────────────
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    // ── 其他请求交给静态资源 ──────────────────────────────
    return env.ASSETS.fetch(request);
  },
};

async function handleChat(request, env) {
  const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODEL = "llama-3.3-70b-versatile";

  const key = env.GROQ_API_KEY;
  if (!key) {
    return json({ error: "GROQ_API_KEY 未配置" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体解析失败" }, 400);
  }

  const { messages, temperature = 0.7, max_tokens = 800 } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages 不能为空" }, 400);
  }

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature, max_tokens }),
  });

  const data = await upstream.json();
  return json(data, upstream.status);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
