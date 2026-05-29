import { useState, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "pop", label: "流行歌曲" },
  { id: "classical", label: "经典纯音乐" },
  { id: "children", label: "儿歌启蒙" },
  { id: "keyboard", label: "电子琴专属" },
];

const DIFFICULTY = ["入门", "简单", "中等"];

const SONGS = [
  {
    id: 1, title: "小星星", category: "children", difficulty: "入门",
    description: "最适合零基础的第一首曲子，旋律简单、节奏稳定。",
    keys: "1 1 5 5 6 6 5 - 4 4 3 3 2 2 1",
    tips: "先用右手练熟旋律，再尝试左手加 Do-Mi-Sol 和弦。",
    tags: ["零基础", "儿歌", "入门必学"],
  },
  {
    id: 2, title: "卡农（简易版）", category: "classical", difficulty: "简单",
    description: "帕赫贝尔卡农改编的单手简易版，旋律优美、广为人知。",
    keys: "3 5 6 1 6 5 3 5 6 5 6 1",
    tips: "注意保持均匀节奏，每个音值一拍，慢速跟练效果更好。",
    tags: ["经典", "浪漫", "练节奏"],
  },
  {
    id: 3, title: "晴天", category: "pop", difficulty: "简单",
    description: "周杰伦热门曲目的超简化钢琴版，保留主旋律精华。",
    keys: "5 6 5 3 2 1 2 3 5 6 5 3",
    tips: "副歌部分节奏稍快，可以先放慢到 60bpm 练熟再加速。",
    tags: ["周杰伦", "流行", "热门"],
  },
  {
    id: 4, title: "生日快乐歌", category: "children", difficulty: "入门",
    description: "每个场合都用得到的经典曲目，5 个音搞定全曲。",
    keys: "5 5 6 5 1 7 - 5 5 6 5 2 1",
    tips: "重点在节奏感，三拍子要稳，每小节第一拍稍微重一点。",
    tags: ["儿歌", "节日", "必学"],
  },
  {
    id: 5, title: "菊花台", category: "pop", difficulty: "简单",
    description: "周杰伦《满城尽带黄金甲》主题曲，旋律古风大气。",
    keys: "6 5 3 5 6 1 6 5 3 2 1",
    tips: "前奏旋律最有辨识度，先练前奏 8 小节就能让人听出来。",
    tags: ["周杰伦", "古风", "流行"],
  },
  {
    id: 6, title: "欢乐颂", category: "classical", difficulty: "入门",
    description: "贝多芬第九交响曲主题，公版曲目无版权顾虑，适合入门。",
    keys: "3 3 4 5 5 4 3 2 1 1 2 3 3 2 2",
    tips: "全曲在同一个八度内完成，右手不需要跨八度移位。",
    tags: ["贝多芬", "古典", "公版"],
  },
  {
    id: 7, title: "少年（梦然）", category: "pop", difficulty: "简单",
    description: "旋律热血励志，节奏感强，简易版去掉复杂装饰音。",
    keys: "1 2 3 5 3 2 1 - 6 1 2 3 5 3 2",
    tips: "副歌节奏是关键，跟着原曲打拍子再弹，更容易找到感觉。",
    tags: ["励志", "流行", "热门"],
  },
  {
    id: 8, title: "天空之城（龙猫主题）", category: "classical", difficulty: "中等",
    description: "宫崎骏动画经典配乐，旋律飘逸，简化版保留主旋律。",
    keys: "5 4 3 4 5 1 - 3 2 1 2 3 5 4 3",
    tips: "速度不要太快，慢弹才能体现出空灵感，建议 ♩=72。",
    tags: ["久石让", "动漫", "经典"],
  },
  {
    id: 9, title: "虫儿飞", category: "children", difficulty: "入门",
    description: "旋律柔和舒缓，儿歌改编，左右手都很简单。",
    keys: "3 3 2 1 2 3 5 - 3 3 2 1 2 1 6",
    tips: "适合练习连音奏法，手指不要抬太高，贴键慢弹。",
    tags: ["儿歌", "轻柔", "入门"],
  },
  {
    id: 10, title: "江南 Style 改编版", category: "keyboard", difficulty: "简单",
    description: "电子琴节奏感超强版本，搭配打击节拍音色效果炸裂。",
    keys: "1 3 5 3 1 - 6 1 3 1 6 - 5 6 1 2 3",
    tips: "推荐电子琴切换「流行」节奏音色，右手弹主旋律即可。",
    tags: ["电子琴", "节奏", "趣味"],
  },
  {
    id: 11, title: "两只老虎", category: "children", difficulty: "入门",
    description: "最经典的儿歌之一，循环旋律，几分钟就能学会。",
    keys: "1 2 3 1 - 1 2 3 1 - 3 4 5 - 3 4 5",
    tips: "全曲只用 Do Re Mi Fa Sol 五个音，是练习五声音阶的好素材。",
    tags: ["儿歌", "零基础", "启蒙"],
  },
  {
    id: 12, title: "恋爱循环", category: "keyboard", difficulty: "中等",
    description: "动漫《猫咪日记》片头曲电子琴版，清新欢快。",
    keys: "5 5 6 5 - 3 2 1 - 3 3 4 3 - 1 6 5",
    tips: "电子琴选「钢琴」或「电钢琴」音色，加一点混响效果更佳。",
    tags: ["动漫", "电子琴", "欢快"],
  },
];

const GUIDE_SECTIONS = [
  {
    id: "keys", icon: "🎹", title: "认识琴键",
    content: [
      "钢琴键盘由黑键和白键组成。白键对应 Do Re Mi Fa Sol La Si（数字简谱 1 2 3 4 5 6 7）。",
      "找到「Do（1）」的方法：找到两个黑键左边的白键，就是 Do。",
      "一组 Do～Si 共 7 个白键，向右重复排列，共有 88 个键（电子琴通常 61 或 76 键）。",
    ],
  },
  {
    id: "notation", icon: "📖", title: "读懂简谱",
    content: [
      "数字 1-7 对应 Do Re Mi Fa Sol La Si，0 表示休止（停顿）。",
      "数字下方加一个点表示低八度，上方加一个点表示高八度。",
      "横线（-）表示延音，即上一个音继续响，不弹新音。",
    ],
  },
  {
    id: "posture", icon: "🖐", title: "手型与姿势",
    content: [
      "坐姿：坐椅子前半段，腰背挺直，双脚平放地面。",
      "手型：手掌自然弯曲，想象手心捧着一个鸡蛋，手指第一关节向下弯。",
      "触键：指尖（肉垫中心偏骨头侧）触键，不要用指甲，力量从肩膀传到手指。",
    ],
  },
  {
    id: "rhythm", icon: "🥁", title: "节奏入门",
    content: [
      "节拍：最常见的是四四拍（4/4），每小节 4 拍，强弱规律为「强-弱-次强-弱」。",
      "打拍：练习时先用脚打拍子，或跟着节拍器走，不要忽快忽慢。",
      "推荐从 ♩=60（每分钟 60 拍）开始，熟练后再逐步加速到标准速度。",
    ],
  },
  {
    id: "chords", icon: "🎵", title: "基础和弦",
    content: [
      "和弦是多个音同时弹响。最基础的是大三和弦：Do-Mi-Sol（1-3-5）。",
      "常用和弦：C 和弦（1-3-5）、F 和弦（4-6-1）、G 和弦（5-7-2）、Am 和弦（6-1-3）。",
      "左手通常弹和弦或低音，右手弹主旋律，两手配合就能演奏完整曲目。",
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function StarRating({ difficulty }) {
  const map = { 入门: 1, 简单: 2, 中等: 3 };
  const stars = map[difficulty] || 1;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((s) => (
        <span key={s} style={{ color: s <= stars ? "#f59e0b" : "#d1d5db", fontSize: 12 }}>★</span>
      ))}
    </span>
  );
}

function Badge({ text }) {
  return (
    <span style={{
      background: "rgba(99,102,241,0.1)", color: "#6366f1",
      borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>{text}</span>
  );
}

function SongCard({ song, onClick }) {
  const catColor = {
    pop: "#ec4899", classical: "#8b5cf6", children: "#f59e0b", keyboard: "#06b6d4"
  };
  return (
    <div
      onClick={() => onClick(song)}
      style={{
        background: "#fff", borderRadius: 16, padding: "20px 22px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)", cursor: "pointer",
        border: "2px solid transparent", transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `2px solid ${catColor[song.category] || "#6366f1"}`;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "2px solid transparent";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{
          background: catColor[song.category] || "#6366f1",
          color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 10px", borderRadius: 99,
        }}>
          {CATEGORIES.find(c => c.id === song.category)?.label}
        </span>
        <StarRating difficulty={song.difficulty} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#1e1b4b" }}>{song.title}</h3>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>{song.description}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {song.tags.map(t => <Badge key={t} text={t} />)}
      </div>
    </div>
  );
}

function SongModal({ song, onClose }) {
  if (!song) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "36px 40px",
          maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b" }}>{song.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "#6b7280",
            }}
          >×</button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{
            background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700,
            padding: "4px 14px", borderRadius: 99,
          }}>
            {CATEGORIES.find(c => c.id === song.category)?.label}
          </span>
          <span style={{
            background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 600,
            padding: "4px 14px", borderRadius: 99,
          }}>
            难度：{song.difficulty} <StarRating difficulty={song.difficulty} />
          </span>
        </div>

        <p style={{ color: "#374151", lineHeight: 1.8, marginBottom: 24 }}>{song.description}</p>

        <div style={{
          background: "#f8f7ff", borderRadius: 12, padding: "16px 20px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8, letterSpacing: 1 }}>
            🎵 简谱预览
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: 18, letterSpacing: 4,
            color: "#1e1b4b", fontWeight: 700, lineHeight: 2,
          }}>
            {song.keys}
          </div>
        </div>

        <div style={{
          background: "#fffbeb", borderRadius: 12, padding: "16px 20px",
          borderLeft: "4px solid #f59e0b",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>💡 练习小贴士</div>
          <p style={{ fontSize: 14, color: "#78350f", lineHeight: 1.7, margin: 0 }}>{song.tips}</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          {song.tags.map(t => <Badge key={t} text={t} />)}
        </div>
      </div>
    </div>
  );
}

function Header({ page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { id: "home", label: "首页" },
    { id: "songs", label: "曲目大全" },
    { id: "guide", label: "入门指南" },
    { id: "about", label: "关于我" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 24px",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <button
          onClick={() => setPage("home")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 28 }}>🎹</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b", lineHeight: 1.2 }}>Danny的音乐馆</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>每日一首简易钢琴曲</div>
          </div>
        </button>

        <nav style={{ display: "flex", gap: 6 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                background: page === item.id ? "#6366f1" : "none",
                color: page === item.id ? "#fff" : "#374151",
                border: "none", borderRadius: 8, padding: "8px 16px",
                cursor: "pointer", fontWeight: 600, fontSize: 14,
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function HeroSection({ setPage }) {
  return (
    <section style={{
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
      padding: "80px 24px",
      textAlign: "center",
      color: "#fff",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎹</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
          零基础也能弹出<br />
          <span style={{ color: "#fde68a" }}>好听的曲子</span>
        </h1>
        <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
          每天一首简易钢琴 / 电子琴教程，数字简谱 + 分步图文，有手就会弹 🎵
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setPage("songs")}
            style={{
              background: "#fff", color: "#6366f1", border: "none",
              borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            浏览所有曲目 →
          </button>
          <button
            onClick={() => setPage("guide")}
            style={{
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700,
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
    { icon: "🎵", value: `${SONGS.length}+`, label: "收录曲目" },
    { icon: "📖", value: "5", label: "入门课程" },
    { icon: "🎯", value: "100%", label: "零基础友好" },
    { icon: "🆓", label: "永久免费", value: "免费" },
  ];
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #f3f4f6",
      padding: "20px 24px",
    }}>
      <div style={{
        maxWidth: 900, margin: "0 auto",
        display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon} <span style={{ fontSize: 22, fontWeight: 900, color: "#6366f1" }}>{s.value}</span></div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryCards({ activeCat, setActiveCat, setPage }) {
  const icons = { all: "🎼", pop: "🎤", classical: "🎻", children: "🌟", keyboard: "🎹" };
  const colors = {
    all: "#6366f1", pop: "#ec4899", classical: "#8b5cf6",
    children: "#f59e0b", keyboard: "#06b6d4",
  };
  return (
    <div style={{ padding: "48px 24px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b", marginBottom: 24, textAlign: "center" }}>
          曲目分类
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
        }}>
          {CATEGORIES.filter(c => c.id !== "all").map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCat(cat.id); setPage("songs"); }}
              style={{
                background: `linear-gradient(135deg, ${colors[cat.id]}22, ${colors[cat.id]}11)`,
                border: `2px solid ${colors[cat.id]}44`,
                borderRadius: 16, padding: "24px 16px", cursor: "pointer",
                textAlign: "center", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors[cat.id]}44, ${colors[cat.id]}22)`;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors[cat.id]}22, ${colors[cat.id]}11)`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>{icons[cat.id]}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors[cat.id] }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                {SONGS.filter(s => s.category === cat.id).length} 首
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedSongs({ onSongClick }) {
  const featured = SONGS.slice(0, 4);
  return (
    <div style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b" }}>🔥 热门推荐</h2>
          <span style={{ fontSize: 13, color: "#6b7280" }}>点击查看完整简谱</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {featured.map(song => <SongCard key={song.id} song={song} onClick={onSongClick} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function HomePage({ setPage, setActiveCat, onSongClick }) {
  return (
    <>
      <HeroSection setPage={setPage} />
      <StatsBar />
      <CategoryCards activeCat="all" setActiveCat={setActiveCat} setPage={setPage} />
      <FeaturedSongs onSongClick={onSongClick} />
    </>
  );
}

function SongsPage({ activeCat, setActiveCat, onSongClick }) {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("全部");

  const filtered = SONGS.filter(s => {
    const matchCat = activeCat === "all" || s.category === activeCat;
    const matchDiff = diffFilter === "全部" || s.difficulty === diffFilter;
    const matchSearch = s.title.includes(search) || s.tags.some(t => t.includes(search));
    return matchCat && matchDiff && matchSearch;
  });

  const catColors = { pop: "#ec4899", classical: "#8b5cf6", children: "#f59e0b", keyboard: "#06b6d4", all: "#6366f1" };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1e1b4b", marginBottom: 8 }}>🎵 曲目大全</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>共收录 {SONGS.length} 首曲目，持续更新中</p>

      {/* Filters */}
      <div style={{ marginBottom: 28, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索曲目名称或标签..."
          style={{
            border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 16px",
            fontSize: 14, width: 220, outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                background: activeCat === cat.id ? (catColors[cat.id] || "#6366f1") : "#f3f4f6",
                color: activeCat === cat.id ? "#fff" : "#374151",
                border: "none", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["全部", ...DIFFICULTY].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              style={{
                background: diffFilter === d ? "#f59e0b" : "#f3f4f6",
                color: diffFilter === d ? "#fff" : "#374151",
                border: "none", borderRadius: 8, padding: "8px 12px",
                cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16 }}>没有找到匹配的曲目</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {filtered.map(song => <SongCard key={song.id} song={song} onClick={onSongClick} />)}
        </div>
      )}
    </div>
  );
}

function GuidePage() {
  const [active, setActive] = useState(GUIDE_SECTIONS[0].id);
  const section = GUIDE_SECTIONS.find(s => s.id === active);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1e1b4b", marginBottom: 8 }}>📖 入门指南</h1>
      <p style={{ color: "#6b7280", marginBottom: 36 }}>零基础必读，从认识琴键到独立演奏</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Sidebar */}
        <div style={{ minWidth: 180 }}>
          {GUIDE_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: active === s.id ? "#6366f1" : "transparent",
                color: active === s.id ? "#fff" : "#374151",
                border: "none", borderRadius: 10, padding: "12px 16px",
                cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 6,
                transition: "all 0.15s",
              }}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "32px 36px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", marginBottom: 24 }}>
              {section.icon} {section.title}
            </h2>
            {section.content.map((line, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, marginBottom: 20,
                padding: "16px 20px", background: "#f8f7ff", borderRadius: 10,
              }}>
                <div style={{
                  minWidth: 28, height: 28, background: "#6366f1",
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, color: "#374151", lineHeight: 1.75, fontSize: 15 }}>{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  const platforms = [
    { name: "抖音", icon: "🎵", handle: "@Danny的音乐馆", color: "#000" },
    { name: "小红书", icon: "📕", handle: "@Danny的简易钢琴", color: "#ff2442" },
    { name: "B站", icon: "📺", handle: "Danny的音乐馆", color: "#00a1d6" },
  ];

  const features = [
    { icon: "📅", title: "每日更新", desc: "坚持日更一首简易曲目，风雨无阻" },
    { icon: "🎯", title: "数字简谱", desc: "全程使用 1234567 简谱，无需读五线谱" },
    { icon: "🧠", title: "AI 辅助", desc: "结合 AI 技术优化教学内容和曲谱生成" },
    { icon: "🆓", title: "完全免费", desc: "所有基础教程和曲谱永久免费开放" },
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Profile */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: 20, padding: "40px", color: "#fff", marginBottom: 36,
        display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
          flexShrink: 0,
        }}>
          🎹
        </div>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Danny</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.7, maxWidth: 480 }}>
            钢琴爱好者 · 编程 & AI 工程师 · 内容创作者<br />
            用技术让钢琴教学更简单、更高效，让每个人都能感受到音乐的快乐。
          </p>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16, marginBottom: 36,
      }}>
        {features.map(f => (
          <div key={f.title} style={{
            background: "#fff", borderRadius: 14, padding: "24px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Social */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", marginBottom: 20 }}>📲 关注我</h3>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {platforms.map(p => (
            <div key={p.name} style={{
              background: "#f9fafb", borderRadius: 12, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 10, minWidth: 180,
            }}>
              <span style={{ fontSize: 28 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: "#1e1b4b" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{p.handle}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 24, padding: "16px 20px", background: "#f0fdf4",
          borderRadius: 10, borderLeft: "4px solid #22c55e",
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#166534", lineHeight: 1.7 }}>
            💬 <strong>有任何问题、求谱、合作意向</strong>，欢迎在各平台私信联系，每天都会查看消息！
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer({ setPage }) {
  return (
    <footer style={{
      background: "#1e1b4b", color: "#a5b4fc",
      padding: "40px 24px 24px", marginTop: 80,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🎹</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Danny的音乐馆</span>
            </div>
            <p style={{ fontSize: 14, maxWidth: 240, lineHeight: 1.7, margin: 0 }}>
              每日一首简易钢琴曲，用数字简谱让零基础也能享受音乐。
            </p>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: 1 }}>导航</div>
            {[["home", "首页"], ["songs", "曲目大全"], ["guide", "入门指南"], ["about", "关于我"]].map(([id, label]) => (
              <button key={id} onClick={() => setPage(id)} style={{
                display: "block", background: "none", border: "none",
                color: "#a5b4fc", cursor: "pointer", fontSize: 14, padding: "4px 0",
              }}>{label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: 1 }}>分类</div>
            {CATEGORIES.filter(c => c.id !== "all").map(c => (
              <div key={c.id} style={{ fontSize: 14, padding: "4px 0" }}>{c.label}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, textAlign: "center", fontSize: 13 }}>
          © 2026 Danny的音乐馆 · 用 ❤️ 和 🎵 制作 · 保留所有权利
        </div>
      </div>
    </footer>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [activeCat, setActiveCat] = useState("all");
  const [selectedSong, setSelectedSong] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      <Header page={page} setPage={setPage} />
      <main>
        {page === "home" && (
          <HomePage
            setPage={setPage}
            setActiveCat={setActiveCat}
            onSongClick={setSelectedSong}
          />
        )}
        {page === "songs" && (
          <SongsPage
            activeCat={activeCat}
            setActiveCat={setActiveCat}
            onSongClick={setSelectedSong}
          />
        )}
        {page === "guide" && <GuidePage />}
        {page === "about" && <AboutPage />}
      </main>
      <Footer setPage={setPage} />
      <SongModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
}
