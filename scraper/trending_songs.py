"""
trending_songs.py — 中国社交媒体热歌爬虫

数据源：
  1. 网易云音乐  热歌榜 / 飙升榜 / 抖音榜 / 新歌榜
  2. QQ 音乐    巅峰榜·流行 / 热歌榜
  3. Bing 搜索  小红书近期热歌（关键词抓取）

用法：
  python scraper/trending_songs.py

依赖：
  pip install requests beautifulsoup4
"""

import json
import re
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# ─── 通用请求配置 ─────────────────────────────────────────────────────────────

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
})

TIMEOUT = 10


def safe_get(url, **kwargs):
    """带错误处理的 GET，返回 Response 或 None"""
    try:
        r = SESSION.get(url, timeout=TIMEOUT, **kwargs)
        r.raise_for_status()
        return r
    except Exception as e:
        print(f"    ⚠️  请求失败 {url[:60]}…  {e}")
        return None


# ─── 1. 网易云音乐 ─────────────────────────────────────────────────────────────

NETEASE_CHARTS = {
    "网易热歌榜":  3778678,
    "网易飙升榜":  19723756,
    "网易抖音榜":  2250011882,
    "网易新歌榜":  3779629,
}

def fetch_netease(chart_name: str, playlist_id: int) -> list[dict]:
    """抓取网易云音乐榜单（非官方 API）"""
    url = f"https://music.163.com/api/playlist/detail?id={playlist_id}"
    headers = {
        "Referer": "https://music.163.com/",
        "Cookie": "os=pc; osver=Microsoft-Windows-10; appver=2.9.7",
    }
    r = safe_get(url, headers=headers)
    if not r:
        return []

    try:
        data = r.json()
        tracks = data["result"]["tracks"]
        songs = []
        for t in tracks[:50]:
            songs.append({
                "rank":    len(songs) + 1,
                "title":   t.get("name", ""),
                "artists": " / ".join(a["name"] for a in t.get("artists", [])),
                "source":  chart_name,
            })
        return songs
    except Exception as e:
        print(f"    ⚠️  解析失败 {chart_name}: {e}")
        return []


def fetch_all_netease() -> list[dict]:
    results = []
    for name, pid in NETEASE_CHARTS.items():
        print(f"  → {name}")
        songs = fetch_netease(name, pid)
        print(f"     获取 {len(songs)} 首")
        results.extend(songs)
        time.sleep(0.8)
    return results


# ─── 2. QQ 音乐 ───────────────────────────────────────────────────────────────

QQ_CHARTS = {
    "QQ流行榜":  62,     # 巅峰榜·流行
    "QQ热歌榜":  26,     # 热歌榜
    "QQ新歌榜":  27,     # 新歌榜
}

def fetch_qq(chart_name: str, topid: int) -> list[dict]:
    url = (
        "https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg"
        f"?topid={topid}&format=json&tpl=3&page=detail"
        "&type=top&platform=h5"
    )
    headers = {
        "Referer":  "https://y.qq.com/",
        "Origin":   "https://y.qq.com",
    }
    r = safe_get(url, headers=headers)
    if not r:
        return []

    try:
        data = r.json()
        songs = []
        for item in data.get("songlist", [])[:50]:
            si = item.get("data", item)
            title   = si.get("songname") or si.get("name", "")
            artists = " / ".join(
                s.get("name", "") for s in si.get("singer", [])
            )
            songs.append({
                "rank":    len(songs) + 1,
                "title":   title,
                "artists": artists,
                "source":  chart_name,
            })
        return songs
    except Exception as e:
        print(f"    ⚠️  解析失败 {chart_name}: {e}")
        return []


def fetch_all_qq() -> list[dict]:
    results = []
    for name, tid in QQ_CHARTS.items():
        print(f"  → {name}")
        songs = fetch_qq(name, tid)
        print(f"     获取 {len(songs)} 首")
        results.extend(songs)
        time.sleep(0.8)
    return results


# ─── 3. 小红书 / 抖音 —— 通过 Bing 搜索抓关键词 ───────────────────────────────

SEARCH_QUERIES = [
    "小红书 2025 最近流行的歌曲 推荐",
    "抖音热门歌曲 2025 榜单",
    "小红书 BGM 最近火的歌",
    "抖音 最火 神曲 2025",
]

SONG_RE = re.compile(
    "[《〈「『“‘【\[]"
    "([^》〉」』”’】\]]{1,30})"
    "[》〉」』”’】\]]"
)


def search_bing(query: str) -> list[str]:
    """Bing 搜索，提取页面中书名号包裹的歌名"""
    url = f"https://www.bing.com/search?q={requests.utils.quote(query)}&setlang=zh-CN"
    r = safe_get(url, headers={"Accept": "text/html"})
    if not r:
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    text = soup.get_text(" ", strip=True)
    return SONG_RE.findall(text)


def fetch_social_media_songs() -> list[dict]:
    """汇总从搜索结果里提取到的歌名，按出现频次排序"""
    counter: dict[str, int] = {}
    query_map: dict[str, str] = {}

    for q in SEARCH_QUERIES:
        label = "小红书" if "小红书" in q else "抖音"
        print(f"  → Bing 搜索：{q[:30]}…")
        titles = search_bing(q)
        for t in titles:
            t = t.strip()
            if not t or len(t) < 2:
                continue
            counter[t] = counter.get(t, 0) + 1
            if t not in query_map:
                query_map[t] = label
        time.sleep(1.2)

    # 按频次降序，取前 50
    ranked = sorted(counter.items(), key=lambda x: -x[1])[:50]
    songs = []
    for i, (title, freq) in enumerate(ranked, 1):
        songs.append({
            "rank":    i,
            "title":   title,
            "artists": "",
            "source":  f"{query_map.get(title, '社媒搜索')} (提及{freq}次)",
        })
    return songs


# ─── 去重 & 汇总 ──────────────────────────────────────────────────────────────

def deduplicate(songs: list[dict]) -> list[dict]:
    """同名歌曲只保留第一次出现（忽略大小写和空格）"""
    seen: set[str] = set()
    out = []
    for s in songs:
        key = re.sub(r"\s+", "", s["title"]).lower()
        if key not in seen:
            seen.add(key)
            out.append(s)
    return out


# ─── 主流程 ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  🎵 中国社交媒体热歌爬虫")
    print(f"  运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)

    all_songs: list[dict] = []

    print("\n[1/3] 网易云音乐榜单")
    all_songs.extend(fetch_all_netease())

    print("\n[2/3] QQ 音乐榜单")
    all_songs.extend(fetch_all_qq())

    print("\n[3/3] 小红书 / 抖音（Bing 搜索提取）")
    all_songs.extend(fetch_social_media_songs())

    unique = deduplicate(all_songs)

    # ── 打印结果 ──
    print("\n" + "=" * 55)
    print(f"  📋 汇总热歌榜（去重后共 {len(unique)} 首）")
    print("=" * 55)
    print(f"{'#':<4} {'歌名':<25} {'歌手':<20} 来源")
    print("-" * 80)
    for s in unique:
        print(
            f"{s['rank']:<4} "
            f"{s['title']:<25} "
            f"{s['artists']:<20} "
            f"{s['source']}"
        )

    # ── 保存 JSON ──
    out_path = f"output/trending_songs_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    import os
    os.makedirs("output", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 已保存到 {out_path}")


if __name__ == "__main__":
    main()
