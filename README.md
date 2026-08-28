# 西方思想史 · 哲学篇

Vue 3 + Vite + vue-i18n（中 / EN / 日本語）的西方思想简史。目前只有哲学脉络：希腊三贤 → 理性主义与经验主义并列 → 康德合流 → 黑格尔后分裂。

```bash
npm install
npm run dev
```

## GitHub Pages

站点地址：https://joshuamchan.github.io/ph/ （会自动跳转到构建版本）

若直接访问构建产物：https://joshuamchan.github.io/ph/docs/

推送到 `main` 后会自动 `npm run build`，并把产物写入 `docs/`（同时更新 `gh-pages` 分支）。

**Settings → Pages → Build and deployment** 任选其一：

| Source | 设置 |
|--------|------|
| Deploy from a branch（推荐） | Branch: **`main`**，Folder: **`/docs`** |
| Deploy from a branch | Branch: **`gh-pages`**，Folder: **`/ (root)`** |
| GitHub Actions | Source: **GitHub Actions** |

不要选 **`main` / `/ (root)`**——那是 Vue 源码，浏览器无法运行 `/src/main.ts`，页面会空白。
