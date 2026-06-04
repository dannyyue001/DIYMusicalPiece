import { useState, useEffect, useCallback, useRef } from "react";

// ─── Palette & tokens ────────────────────────────────────────────────────────

const COLOR = {
  primary:   "#6366f1",
  secondary: "#8b5cf6",
  pop:       "#ec4899",
  classical: "#8b5cf6",
  children:  "#f59e0b",
  keyboard:  "#06b6d4",
  text:      "#1e1b4b",
  muted:     "#6b7280",
  bg:        "#f8f7ff",
  card:      "#ffffff",
  border:    "#e5e7eb",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       label: "全部",     icon: "🎼" },
  { id: "pop",       label: "流行歌曲", icon: "🎤" },
  { id: "classical", label: "经典纯音乐", icon: "🎻" },
  { id: "children",  label: "儿歌启蒙", icon: "🌟" },
  { id: "keyboard",  label: "电子琴专属", icon: "🎹" },
  { id: "game",  label: "游戏插曲", icon: "🎮" },
];

const DIFFICULTY_STARS = { 入门: 1, 简单: 2, 中等: 3 };

const SONGS = [
  {
    id: 1, title: "小星星", category: "children", difficulty: "入门", isNew: false,
    description: "最适合零基础的第一首曲子，旋律简单、节奏稳定。",
    keys: "1 1 5 5 6 6 5 — | 4 4 3 3 2 2 1 — | 5 5 4 4 3 3 2 — | 5 5 4 4 3 3 2 —",
    tips: "先用右手练熟旋律，再尝试左手加 Do-Mi-Sol 和弦。",
    techniques: ["每个音弹完手指不要立刻抬起，感受音延续到下一拍再换", "先只练第一句「1 1 5 5 6 6 5」，弹 10 遍不出错再往后", "用脚轻踩地板打拍子，帮助保持匀速"],
    tags: ["零基础", "儿歌", "入门必学"],
  },
  {
    id: 2, title: "卡农（简易版）", category: "classical", difficulty: "简单", isNew: false,
    description: "帕赫贝尔卡农改编的单手简易版，旋律优美、广为人知。",
    keys: "5 3 4 5 3 4 5 | [5] [6] [7] 1 2 3 4| 3 1 2 3 [3] [4] [5] 1 [7] 1 [6]",
    tips: "保持均匀节奏，每个音值一拍，慢速跟练效果更好。",
    techniques: ["速度控制在 ♩=60，宁慢勿快，节奏均匀比速度更重要", "下行音阶容易越弹越快，专门挑出来慢练", "每个音力度保持一致，不要忽强忽弱"],
    tags: ["经典", "浪漫", "练节奏"],
  },
  {
    id: 3, title: "生日快乐歌", category: "children", difficulty: "入门", isNew: false,
    description: "每个场合都用得到的经典曲目，5 个音搞定全曲。",
    keys: "5 5 6 5 {1} 7 — | 5 5 6 5 {2} {1} — | 5 5 {5} {3} {1} 7 6 — | 4 4 3 1 2 1 —",
    tips: "三拍子要稳，每小节第一拍稍微重一点。",
    techniques: ["这是三拍子（强弱弱），数着「1 2 3」弹，第1拍多用一点力", "第三句出现高音 {5}{3}，提前把手腕移到高音区", "弹熟后可以试着边弹边唱，练习手口配合"],
    tags: ["儿歌", "节日", "必学"],
  },
  {
    id: 4, title: "欢乐颂", category: "classical", difficulty: "入门", isNew: false,
    description: "贝多芬第九交响曲主题，公版曲目无版权顾虑。",
    keys: "3 3 4 5 5 4 3 2 | 1 1 2 3 3 2 2 — | 3 3 4 5 5 4 3 2 | 1 1 2 3 2 1 1 —",
    tips: "全曲在同一个八度内完成，右手不需要跨八度移位。",
    techniques: ["全曲只用 1-5 五根手指，手不需要移位，先找好位置再弹", "相邻音之间手指自然交替，不要抬得太高（离键约 1cm 即可）", "前两句和后两句结尾不同（2 2 和 1 1），注意区分"],
    tags: ["贝多芬", "古典", "公版"],
  },
  {
    id: 5, title: "少年（梦然）", category: "pop", difficulty: "简单", isNew: false,
    description: "旋律热血励志，节奏感强，简易版去掉复杂装饰音。",
    keys: "5 5 5 3 5 3 2 2 | 2 1 3 2 -2 3 [6] 1 | 1 [6] [6] 1 1 4 3 4 | 3 2 1 — — — — —",
    tips: "跟着原曲打拍子再弹，更容易找到节奏感。",
    techniques: ["先把第一句弹熟，注意手指的往复", "慢速分解练习再连起来", "低音 [6] 换到左边键区弹，感受厚重感"],
    tags: ["励志", "流行", "热门"],
  },
  {
    id: 6, title: "天空之城", category: "classical", difficulty: "中等", isNew: false,
    description: "宫崎骏动画经典配乐，旋律飘逸，简化版保留主旋律。",
    keys: "[6] [7] 1 - [7] 1 3 | [7] -  3 6 5 6 {1}| 5 - 3 4 - 3 4 {1} -| 3 - 2 3 {1} ",
    tips: "慢弹才能体现空灵感，建议 ♩=72。",
    techniques: ["触键要轻柔，用指肉而不是指尖，声音才不会硬", "延音踏板：每小节第一拍踩下，下一小节换踏板（有踏板的同学）", "第三句跳到高音 {1}，提前把手移好位置，不要慌乱"],
    tags: ["久石让", "动漫", "经典"],
  },
  
  {
    id: 7, title: "两只老虎", category: "children", difficulty: "入门", isNew: false,
    description: "最经典的儿歌，几分钟学会，练五声音阶好素材。",
    keys: "1 2 3 1 — 1 2 3 1 — | 3 4 5 — 3 4 5 — | 5 6 5 4 3 1 — 5 6 5 4 3 1 — | 1 [5] 1 — 1 [5] 1 —",
    tips: "只用 Do Re Mi Fa Sol 五个音，非常适合绝对初学者。",
    techniques: ["前两句完全相同，弹熟一句等于会了一半", "第三句「5 6 5 4 3 1」是下行，注意不要越弹越快", "结尾 [5] 是低八度 Sol，找到左边第二组的 Sol 键"],
    tags: ["儿歌", "零基础", "启蒙"],
  },
  {
    id: 8, title: "英雄之证", category: "game", difficulty: "中等", isNew: false,
    description: "怪物猎人主题曲，大气磅礴。",
    keys: "2 [6] 2 3 - | 3 2 [6] 6 - 5 4 | 3- 1- 2 3 4 3 2| 3- 1- [6]",
    tips: "注意好视频里的节奏。",
    techniques: ["[6] 是低八度的 La，找到左边第二组的 La 键", "重复2遍即可，先练熟第一句，第二句自然就会了", "结尾 [6] 是低八度 La，提前把手移好位置，不要慌乱"],
    tags: ["改编", ""],
  },
  {
    id: 9, title: "一笑江湖", category: "pop", difficulty: "中等", isNew: true,
    description: "古风，旋律优美。",
    keys: "3 5 3 7- 7  {1} 7- | 7 6 5- 2- 3- | 5 3 2- 1 5- 2- 3",
    tips: "古风曲子节奏偏自由，注意带 '-' 的音要拖长，短音要干脆，不要每个音弹一样长。",
    techniques: ["{1} 是高八度的 Do，位置在右边，提前找好别慌", "带 '-' 的音（如 7- 5-）拖长一拍，弹完别急着走", "整体节奏先慢练，找到长短感后再提速"],
    tags: ["改编", "古风", "热门"],
  },
];

const GUIDE_SECTIONS = [
  {
    id: "keys", icon: "🎹", title: "认识琴键",
    content: [
      "白键对应 Do Re Mi Fa Sol La Si（简谱 1 2 3 4 5 6 7）。找到「Do（1）」：定位两个黑键左边的白键，就是 Do。",
      "一组 Do～Si 共 7 个白键，向右重复排列，钢琴 88 键，电子琴通常 61 或 76 键。",
      "记住「两黑三黑」规律：2 个黑键和 3 个黑键交替出现，是找音位的最快方法。",
    ],
  },
  {
    id: "notation", icon: "📖", title: "读懂简谱",
    content: [
      "数字 1-7 对应 Do Re Mi Fa Sol La Si。0 表示休止（停顿一拍），— 表示延音（上一个音继续响一拍）。",
      "八度标记：[5] [6] [7] 表示低八度（往左弹低一个八度），{1} {2} {3} 表示高八度（往右弹高一个八度）。初学者先只弹没有括号的普通音即可。",
      "| 是小节线，把旋律分成等长的段落，方便对照节拍。4/4 拍最常见，每小节弹 4 拍。",
    ],
  },
  {
    id: "posture", icon: "🖐", title: "手型与姿势",
    content: [
      "坐姿：坐椅子前半段，腰背挺直，双脚平放地面，肘关节与键盘基本平齐。",
      "手型：手掌自然弯曲，想象手心捧着一个鸡蛋，手指第一关节向下弯，指尖触键。",
      "触键：力量从肩膀传到手指，指尖（肉垫中心偏骨头侧）触键，不要用指甲弹。",
    ],
  },
  {
    id: "rhythm", icon: "🥁", title: "节奏入门",
    content: [
      "四四拍（4/4）最常见：每小节 4 拍，强弱规律「强—弱—次强—弱」。",
      "打拍：练习时用脚打拍子，或跟着节拍器走，保持匀速是最重要的基本功。",
      "从 ♩=60（每分钟 60 拍）慢速开始，弹熟后再逐步加速，不要急于求快。",
    ],
  },
  {
    id: "chords", icon: "🎵", title: "基础和弦",
    content: [
      "和弦 = 多个音同时响。最基础的大三和弦：Do-Mi-Sol（1-3-5），左手三根手指按下去。",
      "常用和弦：C（1-3-5）、F（4-6-1）、G（5-7-2）、Am（6-1-3）。4 个和弦能弹大多数流行歌。",
      "左手弹和弦 / 低音，右手弹旋律，两手分开练熟再合并，这是进步最快的练习方法。",
    ],
  },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function cx(...args) { return args.filter(Boolean).join(" "); }

function StarRating({ difficulty }) {
  const n = DIFFICULTY_STARS[difficulty] ?? 1;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= n ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function Chip({ children, color = COLOR.primary, outline = false }) {
  return (
    <span style={{
      display: "inline-block",
      background: outline ? "transparent" : `${color}18`,
      color: outline ? color : color,
      border: outline ? `1.5px solid ${color}` : "none",
      borderRadius: 99, padding: "2px 10px",
      fontSize: 12, fontWeight: 600, lineHeight: 1.6,
    }}>
      {children}
    </span>
  );
}

// ─── SongCard ─────────────────────────────────────────────────────────────────

function SongCard({ song, onClick, isFav = false, onToggleFav }) {
  const [hov, setHov] = useState(false);
  const col = COLOR[song.category] ?? COLOR.primary;

  const handleFavClick = (e) => {
    e.stopPropagation();
    onToggleFav?.(song.id);
  };

  return (
    <article
      onClick={() => onClick(song)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: COLOR.card, borderRadius: 16, padding: "20px 22px",
        cursor: "pointer", position: "relative", overflow: "hidden",
        border: `2px solid ${hov ? col : "transparent"}`,
        boxShadow: hov ? `0 8px 28px ${col}28` : "0 2px 12px rgba(0,0,0,0.07)",
        transform: hov ? "translateY(-4px)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${col}, ${col}88)`,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{
          background: col, color: "#fff",
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
        }}>
          {CATEGORIES.find(c => c.id === song.category)?.label}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {song.isNew && (
            <span style={{
              background: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 800, padding: "2px 7px",
              borderRadius: 99, letterSpacing: 0.5,
            }}>NEW</span>
          )}
          <StarRating difficulty={song.difficulty} />
          {/* 收藏心形按钮 */}
          <button
            onClick={handleFavClick}
            title={isFav ? "取消收藏" : "收藏"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 18, lineHeight: 1, padding: "2px 4px",
              color: isFav ? "#ef4444" : "#d1d5db",
              transition: "transform 0.15s, color 0.15s",
              transform: isFav ? "scale(1.15)" : "scale(1)",
            }}
          >
            {isFav ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: COLOR.text, marginBottom: 6 }}>{song.title}</h3>
      <p style={{ fontSize: 13, color: COLOR.muted, lineHeight: 1.6, marginBottom: 12 }}>{song.description}</p>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {song.tags.map(t => <Chip key={t}>{t}</Chip>)}
      </div>
    </article>
  );
}

// ─── SongModal ────────────────────────────────────────────────────────────────

function SongModal({ song, onClose }) {
  useEffect(() => {
    if (!song) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [song, onClose]);

  if (!song) return null;
  const col = COLOR[song.category] ?? COLOR.primary;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20, backdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLOR.card, borderRadius: 20, padding: "36px 40px",
          maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginBottom: 6 }}>{song.title}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ background: col, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 99 }}>
                {CATEGORIES.find(c => c.id === song.category)?.label}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: COLOR.muted }}>
                难度 <StarRating difficulty={song.difficulty} /> {song.difficulty}
              </span>
              {song.isNew && <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99 }}>NEW</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            style={{
              background: "#f3f4f6", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", fontSize: 18, color: COLOR.muted,
              flexShrink: 0, marginLeft: 12,
            }}
          >×</button>
        </div>

        <p style={{ color: "#374151", lineHeight: 1.8, marginBottom: 24 }}>{song.description}</p>

        {/* Score preview */}
        <div style={{ background: "#f8f7ff", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            🎵 简谱旋律
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: 5, color: COLOR.text, fontWeight: 700, lineHeight: 2.2 }}>
            {song.keys}
          </div>
          {/* 符号说明 */}
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e7eb",
            display: "flex", flexWrap: "wrap", gap: "6px 18px",
          }}>
            {[
              ["1–7", "Do 到 Si"],
              ["—", "延音（续拍）"],
              ["0", "休止（停顿）"],
              ["|", "小节线"],
              ["[6]", "低八度"],
              ["{1}", "高八度"],
            ].map(([sym, desc]) => (
              <span key={sym} style={{ fontSize: 11, color: "#6b7280" }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: COLOR.primary }}>{sym}</span>
                {" "}{desc}
              </span>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: "16px 20px", borderLeft: `4px solid #f59e0b`, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>💡 练习小贴士</div>
          <p style={{ fontSize: 14, color: "#78350f", lineHeight: 1.75, margin: 0 }}>{song.tips}</p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {song.tags.map(t => <Chip key={t}>{t}</Chip>)}
        </div>
      </div>
    </div>
  );
}

// ─── ScrollToTop ──────────────────────────────────────────────────────────────

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="回到顶部"
      style={{
        position: "fixed", bottom: 32, right: 32, zIndex: 500,
        width: 48, height: 48, borderRadius: "50%",
        background: COLOR.primary, color: "#fff",
        border: "none", cursor: "pointer", fontSize: 20,
        boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
        transition: "opacity 0.2s",
      }}
    >↑</button>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ page, setPage, username, favCount, onAccountClick, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const NAV = [
    { id: "home",  label: "首页" },
    { id: "songs", label: "曲目大全" },
    { id: "guide", label: "入门指南" },
    { id: "about", label: "关于我" },
  ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${COLOR.border}`,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        {/* Logo */}
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎹</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLOR.text, lineHeight: 1.2 }}>Danny的音乐馆</div>
            <div style={{ fontSize: 11, color: COLOR.muted }}>每日一首简易钢琴曲</div>
          </div>
        </button>

        {/* Nav + 用户区 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                background: page === item.id ? COLOR.primary : "transparent",
                color: page === item.id ? "#fff" : "#374151",
                border: "none", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.15s",
              }}>{item.label}</button>
            ))}
          </nav>

          {/* 用户区 */}
          {username ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: `${COLOR.primary}12`, border: `1.5px solid ${COLOR.primary}30`,
                  borderRadius: 99, padding: "6px 14px 6px 8px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                }}>{username[0].toUpperCase()}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.primary }}>{username}</span>
                {favCount > 0 && (
                  <span style={{
                    background: "#ef4444", color: "#fff",
                    borderRadius: 99, fontSize: 10, fontWeight: 800,
                    padding: "1px 6px", lineHeight: 1.6,
                  }}>❤️ {favCount}</span>
                )}
              </button>

              {/* 下拉菜单 */}
              {showUserMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "#fff", border: `1px solid ${COLOR.border}`,
                  borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  minWidth: 160, zIndex: 300, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLOR.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{username}</div>
                    <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>已收藏 {favCount} 首</div>
                  </div>
                  <button onClick={() => { setPage("songs"); setShowUserMenu(false); }} style={{
                    width: "100%", padding: "10px 16px", border: "none", background: "none",
                    textAlign: "left", cursor: "pointer", fontSize: 13, color: COLOR.text,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>❤️ 我的收藏</button>
                  <button onClick={() => { onLogout(); setShowUserMenu(false); }} style={{
                    width: "100%", padding: "10px 16px", border: "none", background: "none",
                    textAlign: "left", cursor: "pointer", fontSize: 13, color: "#ef4444",
                    display: "flex", alignItems: "center", gap: 8,
                    borderTop: `1px solid ${COLOR.border}`,
                  }}>🚪 退出登录</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onAccountClick} style={{
              background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
              color: "#fff", border: "none", borderRadius: 99,
              padding: "8px 18px", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              boxShadow: `0 2px 8px ${COLOR.primary}40`,
              transition: "all 0.15s",
            }}>登录 / 注册</button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

function FloatingNote({ char, style }) {
  return (
    <div style={{
      position: "absolute", userSelect: "none", pointerEvents: "none",
      opacity: 0.18, fontSize: 28, color: "#fff",
      animation: "floatNote 6s ease-in-out infinite",
      ...style,
    }}>{char}</div>
  );
}

function HeroSection({ setPage }) {
  return (
    <section style={{
      background: `linear-gradient(135deg, ${COLOR.primary} 0%, ${COLOR.secondary} 55%, ${COLOR.pop} 100%)`,
      padding: "80px 24px 72px",
      textAlign: "center", color: "#fff",
      position: "relative", overflow: "hidden",
    }}>
      {/* Floating decorations */}
      <FloatingNote char="♩" style={{ top: "15%", left: "8%", animationDelay: "0s" }} />
      <FloatingNote char="♪" style={{ top: "25%", left: "18%", animationDelay: "1s" }} />
      <FloatingNote char="♫" style={{ top: "10%", right: "12%", animationDelay: "2s" }} />
      <FloatingNote char="♬" style={{ bottom: "20%", right: "8%", animationDelay: "0.5s" }} />
      <FloatingNote char="♩" style={{ bottom: "15%", left: "12%", animationDelay: "1.5s" }} />

      <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.15)",
          borderRadius: 99, padding: "6px 18px", fontSize: 13, fontWeight: 700,
          marginBottom: 20, letterSpacing: 1,
        }}>
          🎵 每日更新 · 零基础友好 · 完全免费
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
          零基础也能弹出<br />
          <span style={{ color: "#fde68a" }}>好听的曲子</span>
        </h1>
        <p style={{ fontSize: 17, opacity: 0.92, lineHeight: 1.75, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
          用数字简谱（1234567）教学，不需要读五线谱。<br />
          每天一首，有手就会弹 🎹
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setPage("songs")}
            style={{
              background: "#fff", color: COLOR.primary, border: "none",
              borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            浏览全部曲目 →
          </button>
          <button
            onClick={() => setPage("guide")}
            style={{
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "2px solid rgba(255,255,255,0.45)",
              borderRadius: 12, padding: "14px 28px", fontSize: 16, fontWeight: 700,
              cursor: "pointer", backdropFilter: "blur(8px)",
            }}
          >
            入门指南
          </button>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: `${SONGS.length}+`, label: "收录曲目" },
    { value: "5", label: "入门课程" },
    { value: "每日", label: "更新频率" },
    { value: "免费", label: "永久开放" },
  ];
  return (
    <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "18px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: COLOR.primary }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyPick({ onSongClick }) {
  const pick = SONGS.find(s => s.isNew) ?? SONGS[SONGS.length - 1];
  if (!pick) return null;
  return (
    <div style={{ padding: "48px 24px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginBottom: 18 }}>⭐ 今日推荐</h2>
        <div
          onClick={() => onSongClick(pick)}
          style={{
            background: `linear-gradient(120deg, ${COLOR.primary}ee, ${COLOR.secondary}cc)`,
            borderRadius: 20, padding: "32px 36px", color: "#fff",
            cursor: "pointer", display: "flex", gap: 24, alignItems: "center",
            flexWrap: "wrap", boxShadow: `0 8px 32px ${COLOR.primary}44`,
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <span style={{ fontSize: 56, flexShrink: 0 }}>🎵</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>
              TODAY'S PICK · {CATEGORIES.find(c => c.id === pick.category)?.label}
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{pick.title}</h3>
            <p style={{ opacity: 0.9, lineHeight: 1.6, maxWidth: 480, marginBottom: 12 }}>{pick.description}</p>
            <div style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: 4, opacity: 0.85 }}>
              {pick.keys}
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 20px",
            textAlign: "center", flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>难度</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{pick.difficulty}</div>
            <StarRating difficulty={pick.difficulty} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ setActiveCat, setPage }) {
  const cats = CATEGORIES.filter(c => c.id !== "all");
  return (
    <div style={{ padding: "48px 24px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginBottom: 20 }}>曲目分类</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {cats.map(cat => {
            const col = COLOR[cat.id];
            const count = SONGS.filter(s => s.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCat(cat.id); setPage("songs"); }}
                style={{
                  background: `${col}14`, border: `2px solid ${col}30`,
                  borderRadius: 16, padding: "22px 16px", cursor: "pointer",
                  textAlign: "center", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${col}28`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${col}14`; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize: 34, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 4 }}>{count} 首</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeaturedRow({ onSongClick, favorites = [], onToggleFav }) {
  const featured = [...SONGS].sort((a, b) => b.isNew - a.isNew).slice(0, 4);
  return (
    <div style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text }}>🔥 热门曲目</h2>
          <span style={{ fontSize: 13, color: COLOR.muted }}>点击查看完整简谱</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {featured.map(s => <SongCard key={s.id} song={s} onClick={onSongClick}
            isFav={favorites.includes(s.id)} onToggleFav={onToggleFav} />)}
        </div>
      </div>
    </div>
  );
}

function HomePage({ setPage, setActiveCat, onSongClick, favorites, onToggleFav }) {
  return (
    <>
      <HeroSection setPage={setPage} />
      <StatsBar />
      <DailyPick onSongClick={onSongClick} />
      <CategoryGrid setActiveCat={setActiveCat} setPage={setPage} />
      <FeaturedRow onSongClick={onSongClick} favorites={favorites} onToggleFav={onToggleFav} />
    </>
  );
}

// ─── Songs page ───────────────────────────────────────────────────────────────

function SongsPage({ activeCat, setActiveCat, onSongClick, favorites = [], onToggleFav }) {
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState("全部");

  const filtered = SONGS.filter(s => {
    const okCat  = activeCat === "all" || s.category === activeCat;
    const okDiff = diff === "全部" || s.difficulty === diff;
    const q = search.trim();
    const okQ = !q || s.title.includes(q) || s.tags.some(t => t.includes(q));
    return okCat && okDiff && okQ;
  });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, color: COLOR.text, marginBottom: 6 }}>🎵 曲目大全</h1>
      <p style={{ color: COLOR.muted, marginBottom: 28 }}>共收录 {SONGS.length} 首，持续更新中</p>

      {/* Filters */}
      <div style={{ marginBottom: 28, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索曲名或标签…"
          style={{
            border: `2px solid ${COLOR.border}`, borderRadius: 10,
            padding: "9px 14px", fontSize: 14, width: 200, outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = COLOR.primary}
          onBlur={e => e.target.style.borderColor = COLOR.border}
        />
        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => {
            const col = COLOR[cat.id] ?? COLOR.primary;
            const active = activeCat === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
                background: active ? col : "#f3f4f6",
                color: active ? "#fff" : "#374151",
                border: "none", borderRadius: 8, padding: "7px 13px",
                cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              }}>
                {cat.label}
              </button>
            );
          })}
        </div>
        {/* Difficulty pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {["全部", "入门", "简单", "中等"].map(d => (
            <button key={d} onClick={() => setDiff(d)} style={{
              background: diff === d ? "#f59e0b" : "#f3f4f6",
              color: diff === d ? "#fff" : "#374151",
              border: "none", borderRadius: 8, padding: "7px 11px",
              cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s",
            }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: COLOR.muted }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🔍</div>
          <div style={{ fontSize: 16 }}>没有找到匹配的曲目</div>
          <button onClick={() => { setActiveCat("all"); setSearch(""); setDiff("全部"); }}
            style={{ marginTop: 16, background: COLOR.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontWeight: 700 }}>
            重置筛选
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: COLOR.muted, marginBottom: 16 }}>显示 {filtered.length} / {SONGS.length} 首</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 18 }}>
            {filtered.map(s => <SongCard key={s.id} song={s} onClick={onSongClick}
              isFav={favorites.includes(s.id)} onToggleFav={onToggleFav} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Guide page ───────────────────────────────────────────────────────────────

function GuidePage() {
  const [active, setActive] = useState(GUIDE_SECTIONS[0].id);
  const section = GUIDE_SECTIONS.find(s => s.id === active);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, color: COLOR.text, marginBottom: 6 }}>📖 入门指南</h1>
      <p style={{ color: COLOR.muted, marginBottom: 36 }}>零基础必读，从认识琴键到独立演奏</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Sidebar */}
        <div style={{ minWidth: 176 }}>
          {GUIDE_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: active === s.id ? COLOR.primary : "transparent",
                color: active === s.id ? "#fff" : "#374151",
                border: "none", borderRadius: 10, padding: "11px 14px",
                cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 5,
                transition: "all 0.15s",
              }}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ background: COLOR.card, borderRadius: 16, padding: "32px 36px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: COLOR.text, marginBottom: 28 }}>
              {section.icon} {section.title}
            </h2>
            {section.content.map((line, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, padding: "16px 18px", background: "#f8f7ff", borderRadius: 10 }}>
                <div style={{
                  minWidth: 26, height: 26, background: COLOR.primary, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2,
                }}>{i + 1}</div>
                <p style={{ margin: 0, color: "#374151", lineHeight: 1.8, fontSize: 14 }}>{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── About page ───────────────────────────────────────────────────────────────

function AboutPage() {
  const platforms = [
    { name: "抖音", icon: "🎵", handle: "@钢琴蕉师yy" },
    { name: "小红书", icon: "📕", handle: "@进击的蕉师yy" },
    { name: "B 站", icon: "📺", handle: "yy来也" },
    
  ];
  const features = [
    { icon: "📅", title: "每日更新", desc: "坚持日更一首简易曲目" },
    { icon: "🎯", title: "数字简谱", desc: "全程 1234567，无需读五线谱" },
    { icon: "🧠", title: "AI 辅助", desc: "结合 AI 技术优化教学内容" },
    { icon: "🆓", title: "完全免费", desc: "基础教程永久免费开放" },
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Profile banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
        borderRadius: 20, padding: "40px 44px", color: "#fff", marginBottom: 32,
        display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)", border: "3px solid rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, flexShrink: 0,
        }}>🎹</div>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Danny</h2>
          <p style={{ opacity: 0.92, lineHeight: 1.7, maxWidth: 440, margin: 0 }}>
            钢琴爱好者 · 编程 &amp; AI 工程师 · 内容创作者<br />
            用技术让钢琴教学更简单、更高效，让每个人都能感受到音乐的快乐。
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
        {features.map(f => (
          <div key={f.title} style={{ background: COLOR.card, borderRadius: 14, padding: "22px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: COLOR.text, marginBottom: 5 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: COLOR.muted, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Social links */}
      <div style={{ background: COLOR.card, borderRadius: 16, padding: "28px 32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 19, fontWeight: 800, color: COLOR.text, marginBottom: 18 }}>📲 找到我</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {platforms.map(p => (
            <div key={p.name} style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: COLOR.text, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: COLOR.muted }}>{p.handle}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: "14px 18px", background: "#f0fdf4", borderRadius: 10, borderLeft: "4px solid #22c55e" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#166534", lineHeight: 1.7 }}>
            💬 有任何问题、求谱、合作意向，欢迎在各平台私信联系！每天都会查看消息 ~
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner({ setPage }) {
  return (
    <div style={{ background: `${COLOR.primary}0d`, borderTop: `1px solid ${COLOR.primary}22`, padding: "52px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎹</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginBottom: 12 }}>
          还没开始学吗？
        </h2>
        <p style={{ color: COLOR.muted, lineHeight: 1.7, marginBottom: 28 }}>
          先看看入门指南，5 分钟了解基础知识，然后挑一首你喜欢的曲子就开始弹吧。
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("guide")} style={{
            background: COLOR.primary, color: "#fff", border: "none",
            borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>看入门指南</button>
          <button onClick={() => setPage("songs")} style={{
            background: "transparent", color: COLOR.primary,
            border: `2px solid ${COLOR.primary}`,
            borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>选一首曲子</button>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ setPage }) {
  const NAV = [["home","首页"],["songs","曲目大全"],["guide","入门指南"],["about","关于我"]];
  return (
    <footer style={{ background: COLOR.text, color: "#a5b4fc", padding: "40px 24px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>🎹</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Danny的音乐馆</span>
            </div>
            <p style={{ fontSize: 13, maxWidth: 230, lineHeight: 1.7, margin: 0 }}>
              每日一首简易钢琴曲，数字简谱让零基础也能享受音乐。
            </p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>导航</div>
            {NAV.map(([id, label]) => (
              <button key={id} onClick={() => setPage(id)} style={{
                display: "block", background: "none", border: "none",
                color: "#a5b4fc", cursor: "pointer", fontSize: 13, padding: "4px 0", textAlign: "left",
              }}>{label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>分类</div>
            {CATEGORIES.filter(c => c.id !== "all").map(c => (
              <div key={c.id} style={{ fontSize: 13, padding: "4px 0" }}>{c.icon} {c.label}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>技术栈</div>
            {["React 18", "Vite 5", "纯 CSS-in-JS"].map(t => (
              <div key={t} style={{ fontSize: 13, padding: "4px 0" }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 18, textAlign: "center", fontSize: 13 }}>
          © 2026 Danny的音乐馆 · 用 ❤️ 和 🎵 制作
        </div>
      </div>
    </footer>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

// 通过本地代理调用，Key 存在服务器端 server/.env，不暴露给浏览器
const CHAT_PROXY_URL = "/api/chat";   // Vite 开发时代理到 localhost:3001

// ─── 收藏功能（Cloudflare D1）────────────────────────────────────────────────

// ─── 收藏功能（Cloudflare D1 + JWT 认证）────────────────────────────────────

const FAV_API  = "/api/favorites";
const AUTH_API = "/api/auth";

function getToken()          { return localStorage.getItem("danny_music_token") || ""; }
function getUsername()       { return localStorage.getItem("danny_music_username") || ""; }
function saveAuth(token, username) {
  localStorage.setItem("danny_music_token", token);
  localStorage.setItem("danny_music_username", username);
}
function clearAuth() {
  localStorage.removeItem("danny_music_token");
  localStorage.removeItem("danny_music_username");
}

function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` };
}

async function fetchFavorites() {
  if (!getToken()) return [];
  try {
    const res = await fetch(FAV_API, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites ?? [];
  } catch { return []; }
}

async function toggleFavoriteAPI(songId, isFav) {
  await fetch(FAV_API, {
    method: isFav ? "DELETE" : "POST",
    headers: authHeaders(),
    body: JSON.stringify({ song_id: songId }),
  });
}

async function apiLogin(email, password) {
  const res = await fetch(`${AUTH_API}/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function apiRegister(email, username, password) {
  const res = await fetch(`${AUTH_API}/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  return res.json();
}

// ─── 方案A RAG：关键词检索，只注入命中的曲目 ────────────────────────────────

/**
 * 从用户问题里检索相关曲目（最多返回 3 首）
 * 匹配逻辑：标题 > 标签 > 分类 > 描述，按权重排序
 */
function retrieveSongs(query) {
  if (!query) return [];
  const q = query.toLowerCase();

  const scored = SONGS.map(song => {
    let score = 0;
    const title = song.title.toLowerCase();
    const tags  = song.tags.join(" ").toLowerCase();
    const desc  = song.description.toLowerCase();
    const cat   = song.category.toLowerCase();

    // 标题完整命中权重最高
    if (title.includes(q) || q.includes(title.replace(/[（）()【】]/g, ""))) score += 10;
    // 标题中单字命中
    for (const char of q) {
      if (char.trim() && title.includes(char)) score += 1;
    }
    // 标签命中
    if (tags.includes(q)) score += 5;
    for (const char of q) {
      if (char.trim() && tags.includes(char)) score += 0.5;
    }
    // 描述/分类命中
    if (desc.includes(q) || cat.includes(q)) score += 2;

    return { song, score };
  });

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.song);
}

/** 根据检索结果动态生成 system prompt */
function buildSystemPrompt(userQuery) {
  const BASE = `你是"Danny的音乐馆"网站的 AI 钢琴助教，专门帮助零基础新手学弹钢琴/电子琴。

【简谱符号说明】
- 1-7 = Do Re Mi Fa Sol La Si，— = 延音，0 = 休止，| = 小节线
- [6][7][5] = 低八度，{1}{2}{3} = 高八度

【回答规则】
1. 语言通俗，用术语时立刻附大白话解释
2. 用户问曲库里的歌时，直接给出简谱，并逐段讲解怎么练
3. 用户问曲库外的歌时，说明网站暂未收录，再用通用知识帮助
4. 回答分点说明，每段控制 200 字以内`;

  const hits = retrieveSongs(userQuery);
  if (hits.length === 0) return BASE;

  const catalog = hits.map(s =>
    `《${s.title}》| 难度:${s.difficulty} | 简谱:${s.keys} | 贴士:${s.tips}` +
    (s.techniques ? ` | 技巧:${s.techniques.join("；")}` : "")
  ).join("\n");

  return `${BASE}\n\n【检索到的相关曲目】\n${catalog}`;
}

// 向后兼容：保留 CHAT_SYSTEM 作为无查询时的默认 prompt
const CHAT_SYSTEM = buildSystemPrompt("");

async function callGroq(messages) {
  const tag = "[AI Chat]";
  console.log(`${tag} 请求代理`, CHAT_PROXY_URL, `msgs=${messages.length}`);

  const body = { messages, temperature: 0.7, max_tokens: 800 };

  let res;
  try {
    res = await fetch(CHAT_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`${tag} HTTP 状态`, res.status, res.statusText);
  } catch (networkErr) {
    console.error(`${tag} 网络错误（后端是否已启动？）`, networkErr);
    throw new Error(`无法连接代理服务器，请先运行 node server/index.js`);
  }

  let data;
  try {
    data = await res.json();
    console.log(`${tag} 响应数据`, data);
  } catch (parseErr) {
    console.error(`${tag} JSON 解析失败`, parseErr);
    throw new Error("响应解析失败");
  }

  if (!res.ok) {
    const errMsg = data?.error?.message || res.statusText;
    console.error(`${tag} API 错误`, data);
    throw new Error(`API 错误 ${res.status}：${errMsg}`);
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    console.error(`${tag} 响应结构异常，缺少 choices[0].message.content`, data);
    throw new Error("响应结构异常");
  }

  console.log(`${tag} 成功，回复长度`, reply.length);
  return reply;
}

function AIChatWidget() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { role: "assistant", content: "你好！我是你的钢琴助教 🎹 有任何练琴问题都可以问我～" }
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    console.log("[AI Chat] 用户发送：", q);

    const newHistory = [...history, { role: "user", content: q }];
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    // RAG：根据用户问题动态检索相关曲目，注入 system prompt
    const dynamicSystem = buildSystemPrompt(q);
    const apiMessages = [
      { role: "system", content: dynamicSystem },
      ...newHistory.filter(m => m.role !== "system"),
    ];

    try {
      const reply = await callGroq(apiMessages);
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("[AI Chat] 最终错误", e);
      setHistory(prev => [...prev, {
        role: "assistant",
        content: `❌ 出错了：${e.message}\n\n请打开浏览器 F12 → Console 查看详细报错。`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI 助教"
        style={{
          position: "fixed", bottom: 88, right: 32, zIndex: 500,
          width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
          color: "#fff", border: "none", cursor: "pointer",
          fontSize: 22, boxShadow: "0 4px 18px rgba(99,102,241,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* 聊天面板 */}
      {open && (
        <div style={{
          position: "fixed", bottom: 152, right: 32, zIndex: 500,
          width: 360, height: 480,
          background: "#fff", borderRadius: 20,
          boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          animation: "fadeIn 0.2s ease",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
            padding: "14px 18px", color: "#fff",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>AI 钢琴助教</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                llama-3.3-70b · {loading ? "思考中…" : "在线"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  background: m.role === "user" ? COLOR.primary : "#f3f4f6",
                  color: m.role === "user" ? "#fff" : COLOR.text,
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px", fontSize: 14, lineHeight: 1.65,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 5, padding: "8px 4px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: COLOR.muted,
                    animation: `floatNote 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: `1px solid ${COLOR.border}`,
            padding: "10px 12px", display: "flex", gap: 8, flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="问任何钢琴问题… (Enter 发送)"
              rows={1}
              style={{
                flex: 1, border: `1.5px solid ${COLOR.border}`, borderRadius: 10,
                padding: "8px 12px", fontSize: 13, resize: "none", outline: "none",
                fontFamily: "inherit", lineHeight: 1.5,
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = COLOR.primary}
              onBlur={e => e.target.style.borderColor = COLOR.border}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? COLOR.primary : "#e5e7eb",
                color: input.trim() && !loading ? "#fff" : "#9ca3af",
                border: "none", borderRadius: 10, padding: "0 16px",
                cursor: input.trim() && !loading ? "pointer" : "default",
                fontWeight: 700, fontSize: 14, flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Global styles (keyframes) ────────────────────────────────────────────────

const GLOBAL_CSS = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatNote {
    0%, 100% { transform: translateY(0) rotate(-8deg); }
    50%       { transform: translateY(-18px) rotate(8deg); }
  }
`;

// ─── App root ─────────────────────────────────────────────────────────────────

// ─── 登录/注册弹窗 ────────────────────────────────────────────────────────────

function AuthModal({ onSuccess, onClose }) {
  const [tab, setTab]   = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = (hasErr) => ({
    width: "100%", border: `1.5px solid ${hasErr ? "#ef4444" : COLOR.border}`,
    borderRadius: 10, padding: "10px 14px", fontSize: 14,
    outline: "none", marginBottom: 10, boxSizing: "border-box",
    fontFamily: "inherit",
  });

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      let data;
      if (tab === "login") {
        data = await apiLogin(email, password);
      } else {
        if (username.length < 2) { setErr("用户名至少 2 个字符"); return; }
        data = await apiRegister(email, username, password);
      }
      if (data.error) { setErr(data.error); return; }
      saveAuth(data.token, data.username);
      onSuccess(data.username);
    } catch { setErr("网络错误，请重试"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px", width: 360,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ fontSize: 28, textAlign: "center", marginBottom: 6 }}>🎵</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: COLOR.text, textAlign: "center", marginBottom: 18 }}>
          {tab === "login" ? "登录你的账号" : "注册新账号"}
        </h2>

        {/* Tab 切换 */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }} style={{
              flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer",
              fontWeight: 700, fontSize: 13, transition: "all 0.15s",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? COLOR.primary : COLOR.muted,
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}>{t === "login" ? "登录" : "注册"}</button>
          ))}
        </div>

        <input type="email" placeholder="邮箱" value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }}
          style={inputStyle(false)} />

        {tab === "register" && (
          <input type="text" placeholder="用户名（昵称）" value={username}
            onChange={e => { setUsername(e.target.value); setErr(""); }}
            style={inputStyle(false)} />
        )}

        <input type="password" placeholder="密码（至少 6 位）" value={password}
          onChange={e => { setPassword(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={inputStyle(false)} />

        {err && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8, marginTop: -4 }}>{err}</p>}

        <button onClick={submit} disabled={loading} style={{
          width: "100%", background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.secondary})`,
          color: "#fff", border: "none", borderRadius: 10, padding: "12px",
          fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, marginTop: 4,
        }}>
          {loading ? "请稍候…" : tab === "login" ? "登录" : "注册并开始收藏"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage]           = useState("home");
  const [activeCat, setActiveCat] = useState("all");
  const [selectedSong, setSong]   = useState(null);

  // 收藏系统（JWT 认证）
  const [username, setUsername]   = useState(getUsername);
  const [favorites, setFavorites] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSongId, setPendingSongId] = useState(null);

  // 登录后拉取收藏
  useEffect(() => {
    if (getToken()) fetchFavorites().then(setFavorites);
  }, [username]);

  const handleToggleFav = useCallback(async (songId) => {
    if (!getToken()) {
      setPendingSongId(songId);
      setShowAuthModal(true);
      return;
    }
    const isFav = favorites.includes(songId);
    setFavorites(prev => isFav ? prev.filter(id => id !== songId) : [...prev, songId]);
    await toggleFavoriteAPI(songId, isFav);
  }, [favorites]);

  const handleAuthSuccess = useCallback(async (uname) => {
    setUsername(uname);
    setShowAuthModal(false);
    const favs = await fetchFavorites();
    setFavorites(favs);
    if (pendingSongId && !favs.includes(pendingSongId)) {
      setFavorites(prev => [...prev, pendingSongId]);
      await toggleFavoriteAPI(pendingSongId, false);
      setPendingSongId(null);
    }
  }, [pendingSongId]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setUsername("");
    setFavorites([]);
  }, []);

  const navigate = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ minHeight: "100vh", background: COLOR.bg }}>
        <Header page={page} setPage={navigate} username={username}
          favCount={favorites.length}
          onAccountClick={() => setShowAuthModal(true)}
          onLogout={handleLogout} />

        <main style={{ animation: "fadeIn 0.25s ease" }} key={page}>
          {page === "home"  && <HomePage setPage={navigate} setActiveCat={setActiveCat}
            onSongClick={setSong} favorites={favorites} onToggleFav={handleToggleFav} />}
          {page === "songs" && <SongsPage activeCat={activeCat} setActiveCat={setActiveCat}
            onSongClick={setSong} favorites={favorites} onToggleFav={handleToggleFav} />}
          {page === "guide" && <GuidePage />}
          {page === "about" && <AboutPage />}
        </main>

        {page === "home" && <CTABanner setPage={navigate} />}
        <Footer setPage={navigate} />
      </div>

      <SongModal song={selectedSong} onClose={() => setSong(null)}
        favorites={favorites} onToggleFav={handleToggleFav} />
      <ScrollToTop />
      <AIChatWidget />
      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
