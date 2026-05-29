# 🎹 Danny的音乐馆

每日一首简易钢琴曲 — 数字简谱教学平台

> 零基础也能弹出好听的曲子。用 1234567 代替五线谱，有手就会弹。

## 功能

- 曲目大全：按分类（流行 / 古典 / 儿歌 / 电子琴）+ 难度筛选 + 关键词搜索
- 今日推荐：每次高亮一首精选曲目
- 简谱预览：点击曲目弹出详情，含简谱、练习贴士
- 入门指南：5 个模块，从认识琴键到基础和弦
- 全站动画：页面切换淡入、悬浮音符装饰、回到顶部按钮

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（自动打开浏览器）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| Vite | 5 | 构建工具 |
| CSS-in-JS (inline) | — | 样式（无需额外 CSS 框架） |

## 项目结构

```
DIYMusicalPiece/
├── index.html          # HTML 入口
├── vite.config.js      # Vite 配置
├── package.json
├── .gitignore
└── src/
    ├── main.jsx        # React 挂载入口
    └── App.jsx         # 全部组件与数据
```

## 部署

构建后将 `dist/` 目录部署到任意静态托管平台：

- **Vercel** — `vercel --prod`（自动识别 Vite 项目）
- **Netlify** — Build command: `npm run build`，Publish directory: `dist`
- **GitHub Pages** — 配合 `vite.config.js` 中 `base` 选项使用

## License

MIT © 2026 Danny
