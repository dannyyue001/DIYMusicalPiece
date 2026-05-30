/**
 * Cloudflare Pages Function — /api/chat
 *
 * 线上环境：Cloudflare 自动运行这个文件处理 /api/chat 请求
 * GROQ_API_KEY 存在 Cloudflare Pages → Settings → Environment Variables，不写在代码里
 */

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function onRequestPost({ request, env }) {
  // 读取 Cloudflare 环境变量里的 key
  const key = env.GROQ_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY 未配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "请求体解析失败" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, temperature = 0.7, max_tokens = 800 } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages 不能为空" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
