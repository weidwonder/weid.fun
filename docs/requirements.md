# weid.fun · 需求文档

> **最后更新**: 2026-04-09
> **状态**: Active

本文档说明「这个项目在做什么」。技术细节见 `docs/architecture.md`，完整设计见 `docs/superpowers/specs/2026-04-09-weid-fun-blog-design.md`。

---

## 1. 项目是什么

weid.fun 是 @weidwonder 的个人博客，同时也是一个**可以作为框架开源**的实验性博客系统。

**核心命题**：

> 每篇文章都应该是一件**独特的视觉/交互作品**，而不是套进同一个 theme 的内容。
> 「独特性本身，就是这个博客的标准。」

这意味着本项目**刻意不使用**任何现成的博客框架（Hugo / Jekyll / Astro / Next.js starter 等）——它们追求一致性，而本项目追求的正相反。

## 2. 要解决的问题

### 2.1 矛盾：极致表现力 vs. 可维护性

- 想要每篇文章都达到「整页即作品」的级别（3D、滚动叙事、交互、音频、独特视觉）
- 但单人博客不可能每篇都手工雕琢几百小时
- **解法**：用 AI Agent 将「原始材料 + 少量指令」自动转换为成品页面，全程不打扰作者；作者用 vibe coding 的方式维护

### 2.2 矛盾：独特性 vs. 标准

- 每篇要独特 → 不能有通用模板
- 但要「品质可控」→ 必须有某种标准
- **解法**：三层可生长的「标准体系」
  - **Hard Rules**：硬规则清单（必须的底线，例如「全端自适应」）
  - **Component Vault**：可复用的 Tier 4 组件库（积木）
  - **Reference Vault**：品味参考画廊（家族感）
- Agent 在生成和自审时都依赖这三层

### 2.3 矛盾：公开框架 vs. 私人博客

- 想让这个框架对其他人也有用（开源）
- 但自己的文章内容、品味积累、reference 画廊是私人的
- **解法**：单仓库双分支
  - `main` 分支 = 纯框架代码（可开源）
  - `personal` 分支 = 框架 + 个人内容（私有）
  - 两个分支共享框架更新，互不污染

## 3. 功能需求

### 3.1 必须 (MVP)

- [x] 每个文章页面达到 Tier 4 表现力级别
- [x] `/publish` skill 支持两种输入模式：**对话式**和**文件夹式**
- [x] 每篇文章由一个 `source/` 文件夹完整定义，支持**幂等重生成**
- [x] **系列 (Series)** 支持：首篇定义 UI 规范，后续沿用
- [x] Agent 生成后**自动 UI 自审**（Playwright 截图 + Agent 视觉评审 + 最多 3 轮迭代）
- [x] **Agent 主动补配图**（通过 `baoyu-article-illustrator` 或同类工具）
- [x] **全端自适应**：所有页面在 desktop / tablet / mobile 三个断点都正常工作
- [x] 首页布局：**生成式门户 (D)** 落地大窗 + **精选橱窗 (C)** 下方展示
- [x] 首页橱窗优先使用文章真实图片；无图时用文章主色填充
- [x] 支持手动 `--pin` 文章始终在首页特别展示
- [x] 部署是独立命令 `/deploy`（**不**随 publish 自动触发）

### 3.2 非需求 (明确不做)

- ❌ CMS / admin 后台 UI
- ❌ 评论 / 用户系统
- ❌ 多作者
- ❌ 自动部署（push-to-deploy）
- ❌ SEO 专门优化（初期）
- ❌ 后端 API（纯静态站点）
- ❌ 一致性强的博客模板（这就是核心反命题）

### 3.3 后续可能 (不在 MVP)

- 命令面板 (⌘K) 的完整版（含搜索、系列列表、About）
- Archive 页面（超过阈值的文章列表）
- RSS / Atom 订阅
- 文章搜索
- Analytics
- 构建缓存优化

## 4. 非功能需求

- **表现力**：每个页面必须达到 Tier 4（参考 Rauno Freiberg / Bartosz Ciechanowski / Bruno Simon 风格）
- **自适应**：所有页面必须在 desktop / tablet / mobile 三个断点通过视觉自审
- **幂等**：删除除 `source/` 外所有产物后重跑 `/publish` 可以重新生成
- **自动化**：Agent 发布流程不需要作者中途介入
- **可开源**：框架分支必须干净、不含任何个人内容

## 5. 使用场景

### 5.1 场景 A：轻量随笔（对话模式）

> 作者在 Claude Code 里打开项目，粘贴一段 markdown + 拖进一张参考图 + 补一句「这篇归 thoughts 系列」。
>
> `/publish --series thoughts`
>
> Agent 自动组织文件夹 → 生成页面 → 自审通过 → 报告本地预览 URL。
>
> 作者预览 → 满意 → `/deploy`。

### 5.2 场景 B：长篇技术深挖（文件夹模式）

> 作者在 `inbox/how-ssl-works/` 下整理好了几张截图、一段 markdown、一个场景指令文件。
>
> `/publish inbox/how-ssl-works --series tech-deep-dive --pin`
>
> Agent 调 `baoyu-article-illustrator` 补几张示意图 → 选组件 → 生成 → 自审循环 → 通过。
>
> 作者预览 → 满意 → `/deploy`。

### 5.3 场景 C：系列首篇 vs 后续

> 作者写系列第一篇时，Agent 自由发挥；完成后自动写入 `series/<name>/spec.json`（字体、主色、布局骨架、用了哪些 primitives）。
>
> 作者写系列第二篇时，Agent 读 spec，在约束下生成——保证系列视觉一致。

### 5.4 场景 D：框架开源

> 未来某天，作者觉得这个框架对别人也有用。
>
> `git push main github.com/weidwonder/weid-fun-framework`
>
> 因为 `main` 分支的 `.gitignore` 已经排除了个人内容，push 出去的是干净的框架代码。其他人可以 clone、调整 primitives、建自己的博客。
