/**
 * worker.js — Cloudflare Worker 入口
 *
 * POST /api/chat              → 代理 Groq API
 * GET  /api/favorites?email=  → 获取收藏列表
 * POST /api/favorites         → 添加收藏 {email, song_id}
 * DELETE /api/favorites       → 删除收藏 {email, song_id}
 * 其他                        → 静态资源
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    if (url.pathname === "/api/favorites") {
      return handleFavorites(request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
};

// ── 收藏 API ──────────────────────────────────────────────────────────────────

async function handleFavorites(request, env, url) {
  const db = env.danny_music_logindb;
  if (!db) return json({ error: "数据库未绑定" }, 500);

  // GET /api/favorites?email=xxx
  if (request.method === "GET") {
    const email = url.searchParams.get("email")?.trim().toLowerCase();
    if (!email) return json({ error: "缺少 email 参数" }, 400);

    const { results } = await db.prepare(
      "SELECT song_id FROM favorites WHERE user_email = ? ORDER BY created_at DESC"
    ).bind(email).all();

    return json({ favorites: results.map(r => r.song_id) });
  }

  // POST /api/favorites  { email, song_id }
  if (request.method === "POST") {
    const { email, song_id } = await request.json();
    if (!email || !song_id) return json({ error: "缺少参数" }, 400);

    await db.prepare(
      "INSERT OR IGNORE INTO favorites (user_email, song_id) VALUES (?, ?)"
    ).bind(email.trim().toLowerCase(), song_id).run();

    return json({ ok: true });
  }

  // DELETE /api/favorites  { email, song_id }
  if (request.method === "DELETE") {
    const { email, song_id } = await request.json();
    if (!email || !song_id) return json({ error: "缺少参数" }, 400);

    await db.prepare(
      "DELETE FROM favorites WHERE user_email = ? AND song_id = ?"
    ).bind(email.trim().toLowerCase(), song_id).run();

    return json({ ok: true });
  }

  return json({ error: "不支持的方法" }, 405);
}

// ── Groq 聊天代理 ─────────────────────────────────────────────────────────────

async function handleChat(request, env) {
  const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODEL = "llama-3.3-70b-versatile";
  const key = env.GROQ_API_KEY;
  if (!key) return json({ error: "GROQ_API_KEY 未配置" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "请求体解析失败" }, 400); }

  const { messages, temperature = 0.7, max_tokens = 800 } = body;
  if (!Array.isArray(messages) || messages.length === 0)
    return json({ error: "messages 不能为空" }, 400);

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature, max_tokens }),
  });

  return json(await upstream.json(), upstream.status);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
