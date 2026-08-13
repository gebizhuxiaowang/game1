# 发布与部署指南

本文档说明如何手动发布 V1/V2 分支，以及如何在 GitHub Pages 和 Cloudflare Pages 中部署本项目。

> 本项目不会自动创建 Git 提交或推送。请在每个命令执行前检查 `git status`，并由维护者决定提交内容与时机。

## 分支约定

```text
main                         # V1 稳定版
feature/v2-live-simulation   # V2 实时修仙版本
```

推荐先将 V2 推送为预览分支，确认体验和构建正常后，再由维护者决定是否合并到 `main`。

## 手动提交与推送

先确认远程地址与当前分支：

```zsh
cd /Users/yanan.wang/Workspace/VSCodeWork/game1/xiuxian-game
git remote -v
git branch --show-current
git status
```

### 推送 V2

确认 V2 改动后，手动选择要提交的文件：

```zsh
git switch feature/v2-live-simulation
git status
git add README.md src/App.css src/App.tsx src/components/V2Dashboard.tsx src/game/persistenceV2.ts src/game/v2.ts doc/deployment.md
git commit -m "feat: add v2 live simulation"
git push -u origin feature/v2-live-simulation
```

若改动范围与上述文件不同，请调整 `git add` 的文件列表；避免在未检查状态时使用无差别的 `git add .`。

### 推送 V1

V1 基线在 `main`。在未合并 V2 前，推送它不会携带 V2 改动：

```zsh
git switch main
git status
git push -u origin main
```

## GitHub Pages

项目使用 Vite 的相对资源路径，支持仓库子路径和自定义域名。

1. 构建：

   ```zsh
   npm ci
   npm run build
   ```

2. 将 `dist/` 作为 GitHub Pages 发布目录。
3. 在仓库 **Settings → Pages** 配置 Pages 发布来源。

## Cloudflare Pages

### 创建项目

1. 打开 **Workers & Pages → Create application → Pages → Connect to Git**。
2. 授权 GitHub 并选择 `game1` 仓库。
3. 填写构建配置：

   | 配置项 | 值 |
   | --- | --- |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node.js version | `22` |

项目不需要环境变量。

### 以 V1 作为正式站点

将 **Production branch** 设置为 `main`。如果创建项目时没有显示该字段，前往：

```text
Pages 项目 → Settings → Builds & deployments → Configure Production deployments
```

选择 `main` 并保存。以后每次推送 `main`，Cloudflare Pages 都会更新正式 Production 部署。

### 以 V2 作为预览站点

推送 `feature/v2-live-simulation` 后，Cloudflare Pages 会将该非生产分支构建为 Preview 部署，生成独立预览 URL，不会覆盖 `main` 的正式网站。

推荐流程：

1. `main` 保持 V1 正式站点。
2. `feature/v2-live-simulation` 用于 V2 Preview 部署与试玩。
3. V2 稳定后，由维护者手动合并到 `main`；下一次 `main` 部署即成为 V2 正式站点。

若希望让 V2 分支直接成为正式版本，在 **Configure Production deployments** 中将 **Production branch** 改为 `feature/v2-live-simulation`。之后该分支的下一次部署会作为 Production 发布。

分支部署入口与行为参考 [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)。本文档相关内容已为遵守许可限制重新表述。

## 静态站点响应头

`public/_headers` 会被 Cloudflare Pages 发布到站点根目录，并应用基础安全响应头。GitHub Pages 不会解释该文件，因此不会影响其部署。

## 发布前检查

每次发布前建议执行：

```zsh
npm run lint
npm run build
git status
git diff --check
```

确认构建成功、静态检查通过，并确认即将提交的文件符合预期后，再执行手动提交和推送。
