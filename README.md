# 修仙模拟器 V2

一个纯前端、单人、实时推进的修仙生存模拟器。V2 保留 V1 的角色、境界、战力、天命和 NPC 数据，并将核心循环升级为“游戏日自动流逝 + 日程队列 + 事件抉择 + 生存经营”。

无需后端、账号或环境变量；可部署到 GitHub Pages 或 Cloudflare Pages。

## V2 核心玩法

- **实时天玄历**：默认现实 1 秒约等于游戏 1 天，支持暂停、1/2/4/8/16 倍速。
- **日程队列**：组合 3/7/14/30 日的闭关、营生、采集/狩猎、游历与养伤安排。
- **生存经营**：灵石、疗伤丹、轻伤/重伤/濒死、洞府修炼与养伤加成互相制约。
- **随机因果**：日志、机会、风险、命运四级事件；风险和命运事件会强制暂停。
- **属性结算**：修为、战力、悟性、道心、根骨、气运、道韵、伤势和洞府共同影响结果。
- **自动策略**：机会事件可选择暂停决策或自动采取谨慎策略；高危事件永远等待玩家。
- **道果检查点**：每 7 日和重大事件前保存检查点；普通死亡可付代价回溯，寿元耗尽或重大因果死亡会进入轮回重修。
- **离线安全结算**：重开网页后最多补算 30 个安全游戏日；危险与命运事件在离线期间不会替玩家自动处理。
- **存档兼容**：自动保存 V2 会话，支持 `DAO2.` 道果码；也可以导入旧版 `DAO1.` 道果码并迁移。

详细设计、机制和任务验收标准见工作区根目录的 [`../doc/v2-live-simulation-plan.md`](../doc/v2-live-simulation-plan.md)。

## 本地运行

前置条件：Node.js 22 或更新版本、npm。

```zsh
cd /Users/yanan.wang/Workspace/VSCodeWork/game1/xiuxian-game
npm install
npm run dev
```

终端会输出本地访问地址，通常为 `http://localhost:5173/`。

生产构建与静态检查：

```zsh
npm run lint
npm run build
```

构建产物在 `dist/`。本地预览生产版本：

```zsh
npm run preview
```

## 手动推送 V1 与 V2 到 GitHub

远程仓库已配置为：

```text
git@github.com:gebizhuxiaowang/game1.git
```

本项目不会自动提交或推送。执行以下命令前，先用 `git status` 确认待提交文件符合预期。

### 1. 提交并推送 V2 分支

当前 V2 工作位于 `feature/v2-live-simulation`。在确认 V2 改动后执行：

```zsh
cd /Users/yanan.wang/Workspace/VSCodeWork/game1/xiuxian-game
git switch feature/v2-live-simulation
git status
git add README.md src/App.css src/App.tsx src/components/V2Dashboard.tsx src/game/persistenceV2.ts src/game/v2.ts
git commit -m "feat: add v2 live simulation"
git push -u origin feature/v2-live-simulation
```

如果你还要将根目录的 V2 设计文档纳入 GitHub 仓库，请先将其复制或移动到 `xiuxian-game/doc/`，再显式执行 `git add doc/v2-live-simulation-plan.md`；该文档目前位于项目仓库外的工作区根目录，默认不会被推送。

### 2. 推送已提交的 V1 基线分支

V1 基线在 `main`，且不需要包含 V2 的文件：

```zsh
cd /Users/yanan.wang/Workspace/VSCodeWork/game1/xiuxian-game
git switch main
git status
git push -u origin main
```

推送完成后，GitHub 会显示两个独立分支：

```text
main                         # V1 稳定版
feature/v2-live-simulation   # V2 实时修仙版本
```

## GitHub Pages 与 Cloudflare Pages

Vite 已使用相对资源路径，仓库子路径和自定义域名均可工作。

### GitHub Pages

1. 构建：`npm ci && npm run build`。
2. 将 `dist/` 作为 Pages 发布目录。
3. 在仓库 **Settings → Pages** 配置发布来源。

### Cloudflare Pages：按 Git 分支部署

创建 Cloudflare Pages 项目时，选择 **Workers & Pages → Create application → Pages → Connect to Git**，连接 GitHub 并选择 `game1` 仓库。

构建配置如下：

- **Build command**：`npm run build`
- **Build output directory**：`dist`
- **Node.js version**：`22`

#### 部署 V1 为正式站点

将 **Production branch** 设置为 `main`。如果创建项目时没有显示该选项，进入：

```text
Pages 项目 → Settings → Builds & deployments → Configure Production deployments
```

选择 `main` 并保存。以后推送到 `main` 会生成正式 Production 部署。

#### 部署 V2 为预览站点

推送 `feature/v2-live-simulation` 后，Cloudflare Pages 会为非生产分支创建 Preview 部署。默认情况下它不会替换 V1 正式站点；你可以在同一 **Builds & deployments** 页面查看、允许或限制预览分支构建。

推荐发布流程：

1. `main` 固定部署 V1 的正式域名。
2. `feature/v2-live-simulation` 自动生成 V2 预览 URL，供测试使用。
3. V2 稳定且你手动合并到 `main` 后，Cloudflare 自动将正式站点更新为 V2。

若未来希望让 V2 直接成为正式环境，只需将 **Production branch** 从 `main` 改为 `feature/v2-live-simulation`；这会让该分支的下一次部署成为 Production。

分支配置入口与行为请参阅 [Cloudflare Pages 官方分支部署控制文档](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)。本段说明已为遵守许可限制重新表述。

`public/_headers` 包含 Cloudflare Pages 可识别的基础安全响应头；GitHub Pages 会安全地忽略它。

## 存档与分支

- 浏览器会自动把 V2 存档写入 `localStorage`。
- 右上角 **道果** 可导出、导入跨浏览器使用的 V2 道果码。
- V1 基线保留在 `main`；V2 开发位于 `feature/v2-live-simulation`。
- 项目不会自动创建 Git 提交或推送；提交与发布均由维护者手动决定。

## 目录结构

```text
src/
  components/       角色创建、V1 兼容界面、V2 实时控制台
  game/             角色、战力、回合、V2 时间/事件/存档领域逻辑
public/_headers     Cloudflare Pages 响应头
../doc/             工作区根目录的 V2 玩法与实施计划
```
