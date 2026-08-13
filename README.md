# 修仙模拟器

一个依据游戏设定打造的纯前端、单人月令回合制修仙文字游戏。项目没有后端、账户或环境密钥，可直接托管到 GitHub Pages 或 Cloudflare Pages。

## 游戏内容

- 五步角色创建：姓名、种族、骨龄、出生地、开局资产包与先天道韵
- 100 级境界、五维道基、灵根修炼修正、功法、装备、洞府和灵石
- 每月 15 项决策罗盘：天命、因缘、历练、道缘、百艺与闭关修持
- 10 条天命主线的阶段数据与年度主线节律
- 命运骰子斗法、胜率反馈、战斗收益与失败损失
- 大境界突破、NPC 好感/关系层级、仙途纪要
- 自动本地存档与可跨浏览器恢复的“道果码”
- 手机、平板和桌面端自适应界面

## 本地开发

**前置条件：** Node.js 22 或更高版本、npm。

```bash
npm install
npm run dev
```

执行检查与生产构建：

```bash
npm run lint
npm run build
```

构建产物位于 `dist/`，可使用以下命令预览：

```bash
npm run preview
```

## GitHub Pages 部署

1. 将 `xiuxian-game` 目录推送至 GitHub 仓库。
2. 在 GitHub Actions 或本地执行 `npm ci && npm run build`。
3. 将 `dist/` 目录作为 GitHub Pages 发布文件。
4. 在仓库 **Settings → Pages** 配置发布来源。

`vite.config.ts` 使用 `base: './'`，而 `index.html` 的静态资源遵循 Vite 的 `BASE_URL`。因此可正确部署在仓库子路径（例如 `https://用户名.github.io/仓库名/`）及自定义域名下。

## Cloudflare Pages 部署

1. 在 Cloudflare Dashboard 打开 **Workers & Pages → Create application → Pages → Connect to Git**，选择 GitHub 仓库。
2. 使用以下构建设置：
   - **Production branch：** `main`（或仓库实际默认分支）
   - **Build command：** `npm run build`
   - **Build output directory：** `dist`
   - **Node.js version：** `22`
3. 保存并部署。后续推送会自动触发预览或生产部署。

无需环境变量。`public/_headers` 在 Cloudflare Pages 部署时会写入基础浏览器安全响应头；GitHub Pages 会忽略该文件，不影响发布。

## 存档说明

游戏状态自动保存在当前浏览器的 `localStorage`。从右上角 **存档** 打开面板后，可生成并复制“道果码”；在另一设备或浏览器粘贴该代码，即可恢复角色和仙途进度。清除浏览器站点数据前，请先导出道果码。

## 项目结构

```text
src/
  components/       角色创建与游戏主界面
  game/             游戏领域逻辑（角色、回合、战斗、存档、静态数据）
  App.tsx           应用状态与页面装配
public/_headers     Cloudflare Pages 响应头
```
