# weid.fun 个人博客系统 · 设计规范

> **日期**: 2026-04-09
> **状态**: Proposed
> **作者**: @weidwonder
> **目标读者**: 本项目后续的实施计划编写者 / 实现者

---

## 1. 背景

weid.fun 是 @weidwonder 的个人博客域名。ICP 已备案、SSL 已就绪（服务器 `47.95.8.46`，详见 `docs/deployment/2026-04-09-ssl证书部署.md`），项目目录除部署文档外为空白。

市面上现成的博客框架（Hugo / Jekyll / Astro / Next.js starter 等）的共同取向是「**一致性**」——一套 theme，一个模板系统，所有文章套进去就能发。但这套博客追求的恰恰相反：**每篇文章都是一件独特的视觉/交互作品**。作者的核心哲学是：

> **「独特性本身就是标准。」**

本设计的任务是发明一套机制，使得：

- 每篇文章都能做到 Tier 4 级别的表现力（整页即作品：3D、滚动叙事、交互、音频、自定义视觉）
- 作者可以用 **vibe coding** 的方式维护
- AI Agent 可以基于原始材料**全自动**生成页面并**自审质量**（不打扰作者）
- 同一「系列」内的文章风格一致（由首篇决定），系列之间可以天差地别
- 这套「独特性标准」不是凭空的——它由**三层可生长的制度**承载

## 2. 目标 & 非目标

### 2.1 目标

1. **Tier 4 表现力**：每篇文章是独立 Tier 4 作品
2. **全自动生成**：Agent 接收原始材料，产出最终页面（含自审循环），全程不打扰用户
3. **幂等**：原始材料存入 `source/` 文件夹后，可以随时从文件夹重生成页面
4. **系列支持**：首篇定义 UI 规范，后续沿用
5. **生长的标准**：Hard Rules + Component Vault + Reference Vault 三层渐进积累
6. **无框架锁死**：不使用博客专用框架；每篇文章是 Vite 独立 entry
7. **全端自适应**：每个页面（首页 + 每篇文章）都必须在 PC 和手机上都能正常访问并自动适配。响应式是 **一等公民**，不是后补的事

### 2.2 非目标

1. **不做 CMS / admin UI** —— 所有操作通过 Claude Code + 文件系统完成
2. **不做评论 / 用户系统** —— 纯静态
3. **不做多作者**
4. **不自动部署** —— 部署是独立命令，给作者本地预览的机会
5. **初期不强求 Hard Rules** —— 规则清单从空开始，使用中积累
6. **初期不追求 SEO** —— 可后续补 meta tags

## 3. 核心概念

### 3.1 三层标准 (Three-Layer Standard)

这是整个系统的**品味中枢**。每层都从空开始，在使用中生长。

#### Layer 1 · Hard Rules

- 位置：`src/standards/hard-rules.md`
- 形态：markdown 规则清单
- 用途：Agent 生成前读取作为约束；自审时逐项检查
- **初始只有一条硬规则**（其它由作者后续补充）：
  > **R1. 全端自适应**：页面必须在 desktop (1920×1080)、tablet (768×1024)、mobile (375×812) 三个断点都能正常访问、无横向滚动、所有交互有 touch 等价方案
- 其它候选规则（作者后续决定是否启用）：
  - 必须有 hero 区
  - 必须有一个「令人记住的瞬间」
  - 禁止 gradient button glow
  - 禁止 saas hero grid

#### Layer 2 · Component Vault

- 位置：`src/primitives/`
- 形态：一组可复用的 Tier 4 组件
- 初始组件：`CornerMarker`（外壳）/ `WebGLHero` / `ScrollReveal` / `DragFigure` / `AudioPad`
- 用途：Agent 生成新文章时优先从 Vault 挑选 + 组合；不够再写新的
- 生长机制：新写的组件若有复用价值，晋升到 Vault（由 Agent 或作者提议）

#### Layer 3 · Reference Vault

- 位置：`src/reference-vault/`
- 形态：图片 + markdown 描述对
- 用途：自审时 Claude 视觉对比，问：「这个新页面和这些参考是不是一家人？」
- 初始状态：**空**（作者后续手动塞入喜欢的参考，如 rauno.me、bartosz ciechanowski 的文章）

### 3.2 文件夹即 Source of Truth

每篇文章由一个文件夹完整定义：

```
articles/<slug>/
├── source/              ← 不可变原始材料（作者输入）
│   ├── raw.md
│   ├── directives.md    ← 可选：场景指令
│   └── attachments/     ← 截图、引用材料
├── assets/              ← Agent 生成/处理的配图
├── index.html           ← Vite entry
├── page.tsx             ← 文章独特实现
└── meta.json            ← slug / title / series / colors / pin / ...
```

**幂等保证**：删除除 `source/` 之外所有内容，重跑 `/publish <slug>`，应重新产出 `assets/ + page.tsx + meta.json`。这允许作者在不满意时无损重生成。

### 3.3 系列 (Series)

```
series/<name>/
├── spec.json            ← 首篇生成后写入：字体 / 主色 / 布局骨架 / primitives 清单
└── snapshot.jpg         ← 首篇首屏截图，供视觉对照
```

- **系列首篇**：Agent 自由设计，完成后将风格决策写入 `spec.json`
- **系列后续**：Agent 读取 `spec.json`，在约束下生成
- **非系列文章**：Agent 完全自由

### 3.3.5 仓库双分支策略 (Framework / Personal Split)

本项目是「**可开源的框架 + 私有的博客**」两用的单仓库，通过分支区分：

#### 分支模型

| 分支 | 角色 | `.gitignore` 策略 |
|---|---|---|
| `main` | **框架分支**（可以开源） | ignore 所有个人内容 |
| `personal` | **博客分支**（私有，或私有 remote） | 不 ignore 个人内容，承载作者的实际博客 |

#### 哪些是「个人内容」(personal) — 仅在 `personal` 分支跟踪

- `articles/*/` 全部（文章原始材料 + 生成产物）
- `series/*/` 全部
- `src/reference-vault/**`（作者的品味参考）
- `src/standards/hard-rules.custom.md`（作者追加的硬规则，若存在）
- `src/home/home-data.json`（动态文章列表，由 publish 流程维护）
- `inbox/**`

#### 哪些是「框架内容」(framework) — 两个分支都跟踪

- `src/primitives/*`（Component Vault 基础组件库）
- `src/standards/hard-rules.md`（R1 等 baseline 硬规则）
- `src/standards/review-prompt.md`
- `src/home/{index.html, page.tsx}`（首页代码结构，但不含 data）
- `src/lib/`
- `scripts/`
- `skills/publish/SKILL.md`
- `vite.config.ts`, `package.json`, `tailwind.config.ts`, `tsconfig.json`
- `docs/`（含 requirements.md / architecture.md / superpowers/specs/）

#### Hard Rules 的分层

- `hard-rules.md` → 框架的 baseline（包含 R1 全端自适应等普遍硬规则）
- `hard-rules.custom.md` → 作者追加的个人偏好（被 ignore，不进入框架）
- Agent 读取时**合并**两个文件作为最终规则集

#### 分支工作流

```
main (framework)  ←─── push to github.com/weidwonder/weid-fun-framework (可选开源)
  │
  │ git checkout -b personal
  ▼
personal (blog)   ←─── push to private remote
  │
  │ (日常工作都在这个分支)
  │ /publish 新文章 → commit 到 personal
  │ 框架有更新时: git merge main
  ▼
```

#### 两个 `.gitignore` 的差异

- `main` 分支的 `.gitignore` 包含所有 personal content 规则
- `personal` 分支的 `.gitignore` 是 `main` 的子集（去掉 personal content 的 ignore）
- Git 的 `.gitignore` 可以在不同分支之间不同——这是这套策略成立的前提

### 3.4 全端自适应 (Responsive as a First-Class Citizen)

**所有页面必须在 PC 和手机上都能正常访问并自动适配**。这不是 nice-to-have，是硬约束。

#### 三个断点 (Canonical Breakpoints)

| 名称 | 视口 | 用途 |
|---|---|---|
| desktop | `1920 × 1080` | 主展示体验 |
| tablet | `768 × 1024` | 过渡态 |
| mobile | `375 × 812` | iPhone 基准，手机主力 |

`self-review.ts` 必须在这三个断点都截图并提交给 Claude Vision 评审。

#### 适配策略（不是简单的「缩放」）

Tier 4 的 3D / 交互 / 滚动叙事在手机上有特殊要求，Agent 生成时必须遵守：

1. **输入差异**：
   - PC 有 hover 和 mouse cursor；手机只有 touch
   - 任何依赖 hover 的交互，必须在 mobile 提供 touch 替代（例如长按 / 点击切换态）
   - 任何 drag 必须支持 touch events（`@use-gesture/react` 或 pointer events 是默认方案）

2. **性能预算**：
   - mobile 上 WebGL/three.js 的 DPR 必须限制（建议 `min(window.devicePixelRatio, 1.5)`）
   - mobile 上粒子数/几何体复杂度要动态降档
   - `primitives/WebGLHero` 等组件必须内置 desktop/mobile 两套预设

3. **布局重排**，不是缩放：
   - PC 的多列网格在 mobile 上纵向堆叠
   - PC 的左/右 split layout 在 mobile 上垂直组合
   - Corner Marker 在 mobile 上要能避让系统 UI（safe-area-inset）

4. **字体与信息密度**：
   - 使用 Tailwind 的 `clamp()` 响应式字号
   - 行宽在 mobile 上重设（`max-w-prose` 等）

5. **降级 / 优雅失败**：
   - 如果某个 primitive 在 mobile 上不合适（例如依赖音频自动播放），Agent 必须提供 fallback（静态图 / 简化版）
   - **严禁「只做 PC 版」或「mobile 提示你用 PC 访问」**

#### Primitives 的响应式契约

`src/primitives/` 下的每个组件必须：
- 默认响应式（根据容器或视口自动调整）
- 暴露 `mobileVariant` 或等价 prop 允许 Agent 明确指定 mobile 行为
- 在 README / 组件顶部注释里写明 desktop vs mobile 的差异

## 4. 系统架构

### 4.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 构建工具 | **Vite** 多页模式 | 每篇文章一个独立 entry，符合「页面即作品」 |
| UI 层 | **React 18 + TypeScript** | Claude 对这套栈熟悉，生成质量最高 |
| 3D / WebGL | **react-three-fiber + @react-three/drei** | Tier 4 工业标准 |
| 动画 | **GSAP** + **Motion One** (`motion`) | 滚动驱动 + 声明式 |
| 样式 | **Tailwind CSS** + 自定义 CSS | 快速原型 + 逃生舱 |
| 包管理/运行时 | **Bun** | 快、TS native、适合 scripts |
| 自审渲染 | **Playwright** | 截图 + 动效录制成熟 |
| 部署 | **rsync + nginx** | 纯静态，已有 SSL |

### 4.2 目录结构

```
weid.fun/
├── src/
│   ├── primitives/              ← Layer 2 Component Vault
│   │   ├── CornerMarker/
│   │   ├── WebGLHero/
│   │   ├── ScrollReveal/
│   │   ├── DragFigure/
│   │   └── AudioPad/
│   ├── reference-vault/         ← Layer 3 Reference Vault
│   │   └── .gitkeep
│   ├── standards/
│   │   ├── hard-rules.md        ← Layer 1 Hard Rules
│   │   └── review-prompt.md     ← 自审用的 prompt 模板
│   ├── lib/                     ← 共用工具 (slugify, data loaders…)
│   ├── home/
│   │   ├── index.html           ← 首页 Vite entry
│   │   ├── page.tsx             ← 首页 D+C 实现
│   │   └── home-data.json       ← 所有文章的元数据
│   └── articles/
│       └── <slug>/              (见 3.2)
├── series/
│   └── <name>/
├── skills/
│   └── publish/
│       └── SKILL.md             ← /publish skill 本体
├── scripts/
│   ├── self-review.ts           ← Playwright + VLM 自审
│   ├── deploy.sh                ← rsync
│   └── slugify.ts
├── docs/
│   ├── requirements.md          ← 需求文档（项目在做什么）
│   ├── architecture.md          ← 架构决策文档（怎么做）
│   ├── deployment/              ← 已有的部署文档
│   └── superpowers/specs/       ← 本 spec 所在地
├── inbox/                       ← 文件夹模式暂存区 (.gitignore)
├── .gitignore                   ← main/personal 分支各自一套
├── vite.config.ts               ← 多页 entry 配置 (动态读 articles/*)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── dist/                        ← 构建产物 (.gitignore)
```

## 5. `/publish` Skill

### 5.1 调用形态

```
/publish [path] [--series <name>] [--pin] [--slug <custom>] [--no-illustrate]
```

- **不传 `path`** → 对话模式：从当前 Claude Code 会话的上下文抓取 markdown + 附件
- **传 `path`** → 文件夹模式：从 `path` 读取
- `--series <name>` → 归属系列
- `--pin` → 首页橱窗特别展示
- `--slug <custom>` → 自定义 URL slug（默认从标题生成）
- `--no-illustrate` → 跳过 baoyu-article-illustrator 补图步骤

### 5.2 两种输入模式

#### 模式 1：对话模式（适合轻量级文章）

用户在 Claude Code 里粘贴 markdown、拖进截图、附上说明，然后：

```
/publish --series tech-deep-dive --pin
```

Skill 从对话上下文抓取所有材料，自动组织成 source 文件夹。

#### 模式 2：文件夹模式（适合大型 / 图文并茂的文章）

用户预先在 `inbox/` 下整理：

```
inbox/how-ssl-works/
├── raw.md
├── directives.md
└── attachments/
    ├── handshake.png
    └── cert.png
```

然后：

```
/publish inbox/how-ssl-works --series tech-deep-dive --pin
```

### 5.3 Pipeline 步骤

1. **组织 source**：从对话/inbox 抓取 → `articles/<slug>/source/`
2. **内容分析**：主题、情绪、关键段落 → 选主色 / 字体 / 组件
3. **读系列 spec**（若有 `--series` 且非首篇）→ 应用风格约束
4. **补图**：调 `baoyu-article-illustrator` 为关键段落补图 → `assets/`（可跳过）
5. **选 primitives**：从 `src/primitives/` 挑选合适组件
6. **写代码**：
   - `articles/<slug>/page.tsx` (React 组件)
   - `articles/<slug>/index.html` (Vite entry)
   - `articles/<slug>/meta.json`
7. **更新 `vite.config.ts`**：追加新 entry
8. **更新 `src/home/home-data.json`**：追加文章元数据
9. **构建**：`bun run build` → `dist/`
10. **自审循环**（见 §6）
11. **若系列首篇**：写 `series/<name>/spec.json` + `snapshot.jpg`
12. **完成报告**：打印文章路径 + `bun run preview` URL

## 6. 自审循环 (Self-Review Loop)

```ts
async function publishWithReview(slug: string) {
  for (let i = 0; i < MAX_ITER; i++) {
    await bunBuild();
    const server = await startPreview();

    const shots = await playwrightCapture({
      url: `${server.url}/articles/${slug}/`,
      viewports: ['1920x1080', '768x1024', '375x812'],
      captureScrollGif: true,
      captureInitialLoadGif: true,
    });

    const review = await claudeVisionReview({
      images: shots,
      hardRules: readFile('src/standards/hard-rules.md'),
      referenceVault: listDir('src/reference-vault/'),
      reviewPrompt: readFile('src/standards/review-prompt.md'),
    });
    // review = { pass: boolean, score: 0-10, issues: string[], suggestions: string[] }

    if (review.pass) return { ok: true, review, iterations: i + 1 };

    await reviseFromReview(slug, review);
  }
  return { ok: false, reason: 'max-iterations-exceeded' };
}
```

- `MAX_ITER = 3`
- 失败时打印全部 review 历史 → 作者手工接管
- Claude Vision 调用方式待 writing-plans 阶段细化（candidates: Playwright MCP / Anthropic Vision API / 在 Claude Code session 内直接用视觉能力）

## 7. 首页机制

### 7.1 D + C 组合布局

```
┌──────────────────────────────────────────┐
│  [角落标记]                    [⌘ 菜单]  │  ← CornerMarker primitive
│                                          │
│                                          │
│            D · 生成式门户                 │  ← 视口满屏
│            (Tier 4 hero 作品)            │
│                                          │
│                                          │
│                ENTER ↓                    │
├──────────────────────────────────────────┤
│                                          │
│           C · 精选橱窗                    │  ← 下滚进入
│     ┌────────┐ ┌────┐ ┌────┐             │
│     │ pinned │ │ 02 │ │ 03 │             │
│     │ cover  │ └────┘ └────┘             │
│     │ 01     │ ┌────┐ ┌────┐             │
│     └────────┘ │ 04 │ │ 05 │             │
│                └────┘ └────┘             │
│                                          │
│             → all writings                │
└──────────────────────────────────────────┘
```

#### C 橱窗的渲染规则

- 每张卡片的 **背景**：
  - 若 `meta.json.coverImage` 有值 → 使用该图片
  - 否则 → 使用 `meta.json.colors.primary` 作纯色填充
- **Pin 优先**：`meta.json.pin === true` 的永远在最前面
- 非 pin 的按 `publishedAt` 倒序
- 超过阈值（例如 12 张）后出现 「→ all writings」 链接跳到 archive 页（MVP 不做 archive，直接全列）

### 7.2 `home-data.json` 格式

```json
{
  "articles": [
    {
      "slug": "how-ssl-works",
      "title": "How SSL Actually Works",
      "series": "tech-deep-dive",
      "publishedAt": "2026-04-09",
      "pin": true,
      "colors": {
        "primary": "#ff006e",
        "bg": "#0a0e1a",
        "accent": "#ffbe0b"
      },
      "coverImage": "/articles/how-ssl-works/assets/cover.webp",
      "excerpt": "TLS 握手里的数学和一点点魔法..."
    }
  ],
  "portal": {
    "title": "A place for curious writing.",
    "lastUpdated": "2026-04-09"
  }
}
```

`src/home/page.tsx` 在构建时读取此 JSON 动态渲染。

## 8. 站点外壳

- **模型**：角落标记 (Corner Marker)
- **实现**：`src/primitives/CornerMarker/` 在所有页面（包括首页和每篇文章页面）统一挂载
- **内容**：
  - 左上角：极小字号的站点名 `weid.fun /`，点击 → 首页
  - 右上角：⌘K 按钮（或图标），打开**命令面板**（含：首页 / 系列列表 / 搜索 / About）

命令面板是第二阶段任务（MVP 可以只有「返回首页」）。

## 9. 部署

### 9.1 命令：`/deploy`

```bash
#!/usr/bin/env bash
set -e
bun run build
rsync -av --delete dist/ root@47.95.8.46:/var/www/weid.fun/
ssh root@47.95.8.46 "nginx -s reload"
```

### 9.2 服务器端 nginx

需要一次性配置：

- HTTP (80) → HTTPS (443) 强制跳转
- HTTPS (443) 使用 `/etc/ssl/weid.fun/fullchain.pem` + `privkey.pem`
- root 指向 `/var/www/weid.fun/`
- 默认 index：`index.html`
- fallback：`try_files $uri $uri/ /index.html =404`

具体 nginx 配置文件将在 writing-plans 阶段生成。

## 10. 冷启动任务

**冷启动是独立的一次性工作**，不捆绑第一次 `/publish`。

**Phase 0：项目基础设施**（已部分完成）

1. ✅ 写 `docs/requirements.md` + `docs/architecture.md`（已于本 brainstorming 后创建）
2. ✅ 写本 design spec
3. ✅ `git init`，写 main 分支的 `.gitignore`（framework 版本，ignore 个人内容）
4. ✅ 首次 commit：spec + docs + gitignore

**Phase 1：框架骨架**

5. 初始化 Vite + React + TypeScript 项目（package.json / tsconfig / vite.config.ts）
6. 安装依赖：`react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `three`, `gsap`, `motion`, `@use-gesture/react`, `tailwindcss`, `playwright`
7. 配 Tailwind + TSConfig + Vite 多页动态 entry
8. 写 `src/primitives/CornerMarker/`（响应式，带 safe-area-inset）
9. 写 3-5 个初始 Tier 4 primitives：`WebGLHero`, `ScrollReveal`, `DragFigure`, `AudioPad`（每个都遵守 §3.4 响应式契约）
10. 写 `src/home/`：D+C 首页（先能从空的 `home-data.json` 渲染一个门户）
11. 写 `scripts/self-review.ts`
12. 写 `skills/publish/SKILL.md`
13. 写 `src/standards/hard-rules.md`（baseline，仅含 R1 全端自适应）
14. 写 `src/standards/review-prompt.md`
15. 写 `scripts/deploy.sh`

**Phase 2：部署 + personal 分支**

16. 服务器端 nginx 配置
17. 首次 deploy（届时首页是一个空空如也的门户 placeholder）
18. `git checkout -b personal`，调整 personal 分支的 `.gitignore`（允许 personal content）
19. （可选）为 main 建立公开 remote，为 personal 建立私有 remote

冷启动完成后，作者在 `personal` 分支发第一篇文章。

## 11. 开放问题 (Deferred to writing-plans)

这些问题不影响设计拍板，但需要在实施计划中逐个确定：

1. **Claude Vision 调用方式**：在 self-review.ts 里怎么调？候选：
   - Playwright MCP + Claude Code session 内视觉能力
   - Anthropic API (claude-opus-4-6) 直接调用
   - 通过 subagent dispatch
2. **对话模式下 slug 的提取规则**：从标题 slugify？如何处理中文？
3. **vite.config.ts 动态 entry 机制**：glob 扫 `src/articles/*/index.html` 还是每次 publish 显式追加？
4. **`--no-illustrate` 的默认值**：是否默认启用补图？
5. **nginx 配置的同步方式**：是否包含在 `deploy.sh` 里，还是单独命令？
6. **MAX_ITER 可配置？**：默认 3，是否允许用户 `/publish --max-iter 5` 覆盖？
7. **Hard Rules 的 fallback 品味**：初期为空时，自审拿什么基准？考虑内置一份「默认品味模板」作为 fallback 参考

---

## 附录 A: 设计决策映射

本 spec 中的每项决策都追溯到 brainstorming 阶段的问题：

| 问题 | 决策 |
|---|---|
| Q1 内容定位 | 混合型 (C) + 系列机制 |
| Q2 表现力档位 | Tier 4 |
| Q3 输入格式 | Markdown + 可选场景指令 + 可选素材 |
| Q4 标准形态 | 三层混合 (Hybrid) |
| Q5 站点外壳 | 角落标记 (Corner Marker) |
| Q6 首页哲学 | D + C 组合（门户 + 橱窗） |
| Q7 技术栈边界 | D（允许 React / Vue 等 UI 库） → 具体化为 Vite + React + r3f + GSAP |
| Q (UX) 输入方式 | 对话模式 + 文件夹模式双支持 |
| Q (补) 全端自适应 | Responsive 作为 Hard Rules R1 + 三断点自审 + Primitives 响应式契约 |
| Q (补) 仓库策略 | `main` (framework) + `personal` (blog) 双分支，不同 `.gitignore` |
| Q (补) 文档结构 | `docs/requirements.md` + `docs/architecture.md` 作为顶层说明文档 |

## 附录 B: 参考资料

- `docs/deployment/2026-04-09-ssl证书部署.md` —— 服务器和 SSL 状态
- brainstorming session mockups: `.superpowers/brainstorm/3469-1775740680/content/`
  - `expressiveness-tiers.html` —— 四档表现力对比
  - `standard-shapes.html` —— 四种标准形态对比
  - `site-chrome.html` —— 四种站点外壳对比
  - `homepage-concepts.html` —— 四种首页哲学对比
  - `full-design.html` —— 完整设计概览
