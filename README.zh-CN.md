# weid.fun

> Tier 4 个人博客框架 —— 每篇文章都是独特作品，而不是套进同一个模板的内容。

**weid.fun** 是一个实验性的个人博客框架，核心命题只有一句：

> *每篇文章都应该是一件独特的视觉/交互作品。独特性本身，就是这个博客的标准。*

这意味着项目**刻意不使用**任何现成的博客框架（Hugo、Jekyll、Astro、Next.js starter 等）。它们追求一致性，而本项目追求的正相反。每篇文章都是独立的页面，可以自由选择自己的技术栈、结构和审美。

English: see [README.md](./README.md).

---

## 核心思想

### 三个矛盾，三种解法

| 矛盾 | 解法 |
|---|---|
| 极致表现力 vs. 单人可维护性 | 用 AI Agent 将原始材料转换为成品页面，作者全程 vibe coding。 |
| 独特性 vs. 品质可控 | 三层「标准」体系（见下）。 |
| 公开框架 vs. 私人博客内容 | 单仓库双分支：`main` 是干净的框架，`personal` 存放你的内容。 |

### 三层标准体系

| 层 | 作用 | 位置 |
|---|---|---|
| **Hard Rules** | 不可协商的底线（如全端自适应） | `src/standards/hard-rules.md` |
| **Component Vault** | 可复用的 Tier 4 组件库 | `src/primitives/*` |
| **Reference Vault** | 品味参考画廊 | `src/reference-vault/*` |

Agent 生成时参考 Layer 1 和 2，自审时对照 Layer 1 和 3。

### 发布流水线

`/publish` skill 接收原始输入（对话或 inbox 文件夹），端到端运行，全程无需作者介入：

1. 组织 `articles/<slug>/source/`
2. 分析内容，选定主色 / 字体 / primitives
3. 若非系列首篇，读取系列规范
4. 按需用 `baoyu-article-illustrator` 自动补配图
5. 写 `page.tsx` / `index.html` / `meta.json`
6. 更新 `vite.config.ts` 入口和 `home-data.json`
7. 用 `bun run build` 构建
8. 自审循环：Playwright 三断点截图 → Agent 视觉评审 → 迭代修复（最多 3 轮）
9. 系列首篇：写入 `series/<name>/spec.json`

部署是独立命令 —— `publish` 不会自动部署。

## 技术栈

| 层 | 选型 |
|---|---|
| 构建 | Vite（多页模式） |
| UI | React 18 + TypeScript |
| 3D / WebGL | react-three-fiber + @react-three/drei |
| 动画 | GSAP + Motion One |
| 手势输入 | @use-gesture/react（统一 pointer events） |
| 样式 | Tailwind CSS + 自定义 CSS |
| 运行时 / 包管理 | Bun |
| 视觉自审 | Playwright + Agent 原生视觉判断 |
| 部署 | rsync + nginx（静态托管） |

## 目录结构

```
weid.fun/
├── src/
│   ├── primitives/          # Component Vault（框架，共享）
│   ├── reference-vault/     # Reference Vault（个人，main 分支 ignore）
│   ├── standards/
│   │   ├── hard-rules.md           # 基线（框架）
│   │   └── hard-rules.custom.md    # 个人叠加（main 分支 ignore）
│   ├── lib/                 # 共用工具
│   ├── home/                # 首页 entry
│   └── articles/            # 所有文章（个人，main 分支 ignore）
├── series/                  # 系列规范（个人，main 分支 ignore）
├── skills/publish/          # /publish skill（框架）
├── scripts/                 # 发布 + 部署脚本（框架）
├── inbox/                   # 文件夹模式暂存（永远 ignore）
├── docs/                    # 框架文档
├── vite.config.ts
└── dist/                    # 构建产物（ignore）
```

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 生产构建
bun run build

# 预览构建产物
bun run preview

# 运行端到端测试
bun run test:e2e
```

## 发布文章

支持两种输入模式：

**对话模式** —— 在 Claude Code 里粘贴 markdown、拖入参考图，然后：

```
/publish --series thoughts
```

**文件夹模式** —— 把原始材料整理到 `inbox/<name>/`，然后：

```
/publish inbox/<name> --series tech-deep-dive --pin
```

Agent 会组织文件夹、生成页面、跑自审循环，完成后返回本地预览 URL。

## 部署

部署刻意和发布分离。脚本依赖环境变量，并要求明确确认：

```bash
WEID_DEPLOY_SERVER=user@your-server ./scripts/deploy.sh --yes
```

参数：
- `--dry-run` —— 仅打印命令不执行
- `--yes` —— 必须显式加上才会真正执行 `rsync --delete` 并 reload nginx

脚本会构建项目、用 rsync 同步 `dist/` 到远程路径、reload nginx。服务器配置模板见 `scripts/nginx/weid.fun.conf`。

## 仓库策略：main vs personal

- **`main`** —— 只包含框架代码。`.gitignore` 排除所有个人内容（文章、reference vault、custom rules、home-data）。可以安全开源。
- **`personal`** —— 框架 + 你的内容。`.gitignore` 是 main 的宽松子集，会追踪个人文件。

合并方向**单向**：`main → personal`。**禁止**从 `personal` 合回 `main` —— 那会把个人内容泄漏到框架分支。

```bash
# 日常写博客
git checkout personal
# 写内容、/publish、预览、/deploy

# 框架增强
git checkout main
# 改 primitives / scripts / skills

# 把框架更新同步到博客
git checkout personal
git merge main
```

## 非目标

项目**明确不做**：

- CMS / admin 后台 UI
- 评论 / 用户系统
- 多作者
- 自动部署（push-to-deploy）
- 专门的 SEO 优化（初期）
- 后端 API（纯静态站点）
- 一致性强的博客模板（这就是核心反命题）

## 状态

Active —— MVP 已交付。Primitives、Hard Rules、Reference Vault 随博客成长持续积累。
