/**
 * worker.js — Cloudflare Worker 入口
 *
 * POST /api/auth/register    → 注册 {email, username, password}
 * POST /api/auth/login       → 登录 {email, password} → {token, username}
 * GET  /api/auth/me          → 验证 token，返回用户信息
 * GET  /api/favorites        → 获取收藏（需要 token）
 * POST /api/favorites        → 添加收藏（需要 token）{song_id}
 * DELETE /api/favorites      → 删除收藏（需要 token）{song_id}
 * POST /api/chat             → Groq 代理
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// JWT secret 从环境变量读取（wrangler secret put JWT_SECRET）
const getJwtSecret = (env) => env.JWT_SECRET || "danny-music-default-secret-change-me";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env, url);
    if (url.pathname === "/api/favorites")     return handleFavorites(request, env);
    if (url.pathname === "/api/chat")          return handleChat(request, env);

    return env.ASSETS.fetch(request);
  },
};

// ── 密码哈希（PBKDF2，Web Crypto API）────────────────────────────────────────

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr));
}

// ── JWT（HMAC-SHA256）────────────────────────────────────────────────────────

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJwt(payload, secret) {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const enc     = new TextEncoder();
  const key     = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig     = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  const sigB64  = b64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${header}.${body}.${sigB64}`;
}

async function verifyJwt(token, secret) {
  try {
    const [header, body, sig] = token.split(".");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(`${header}.${body}`));
    if (!valid) return null;
    return JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

async function getUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return verifyJwt(token, getJwtSecret(env));
}

// ── 认证路由 ─────────────────────────────────────────────────────────────────

async function handleAuth(request, env, url) {
  const db = env.danny_music_logindb;

  // POST /api/auth/register
  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    const { email, username, password } = await request.json();
    if (!email || !username || !password)
      return json({ error: "请填写邮箱、用户名和密码" }, 400);
    if (password.length < 6)
      return json({ error: "密码至少 6 位" }, 400);

    const salt = randomSalt();
    const hash = await hashPassword(password, salt);

    try {
      await db.prepare(
        "INSERT INTO users (email, username, password_hash, salt) VALUES (?, ?, ?, ?)"
      ).bind(email.toLowerCase(), username, hash, salt).run();
    } catch {
      return json({ error: "该邮箱已注册" }, 409);
    }

    const token = await signJwt({ email: email.toLowerCase(), username }, getJwtSecret(env));
    return json({ token, username });
  }

  // POST /api/auth/login
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const { email, password } = await request.json();
    if (!email || !password) return json({ error: "请填写邮箱和密码" }, 400);

    const user = await db.prepare(
      "SELECT username, password_hash, salt FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();

    if (!user) return json({ error: "邮箱或密码错误" }, 401);

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.password_hash) return json({ error: "邮箱或密码错误" }, 401);

    const token = await signJwt({ email: email.toLowerCase(), username: user.username }, getJwtSecret(env));
    return json({ token, username: user.username });
  }

  // GET /api/auth/me
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "未登录" }, 401);
    return json({ email: user.email, username: user.username });
  }

  return json({ error: "未知路由" }, 404);
}

// ── 收藏 API（需要登录）──────────────────────────────────────────────────────

async function handleFavorites(request, env) {
  const db   = env.danny_music_logindb;
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  if (request.method === "GET") {
    const { results } = await db.prepare(
      "SELECT song_id FROM favorites WHERE user_email = ? ORDER BY created_at DESC"
    ).bind(user.email).all();
    return json({ favorites: results.map(r => r.song_id) });
  }

  if (request.method === "POST") {
    const { song_id } = await request.json();
    if (!song_id) return json({ error: "缺少 song_id" }, 400);
    await db.prepare(
      "INSERT OR IGNORE INTO favorites (user_email, song_id) VALUES (?, ?)"
    ).bind(user.email, song_id).run();
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    const { song_id } = await request.json();
    await db.prepare(
      "DELETE FROM favorites WHERE user_email = ? AND song_id = ?"
    ).bind(user.email, song_id).run();
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
  if (!Array.isArray(messages) || !messages.length)
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
