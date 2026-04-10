# weid.fun · 架构决策文档

> **最后更新**: 2026-04-09
> **状态**: Active · Living Document

本文档记录 weid.fun 项目的**架构决策**及**理由**。需求见 `docs/requirements.md`，完整设计见 `docs/superpowers/specs/2026-04-09-weid-fun-blog-design.md`。

---

## 1. 架构全景

```
┌─────────────────────────────────────────────────────────────┐
│  用户输入                                                     │
│  对话模式: Claude Code 上下文 (markdown + 附件)               │
│  文件夹模式: inbox/<name>/ 下的原始材料                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  /publish skill (Claude Code)                                │
│   ① 组织 articles/<slug>/source/                             │
│   ② 内容分析 + 选主色/字体/primitives                         │
│   ③ 读系列 spec (若系列非首篇)                                │
│   ④ 补配图 (baoyu-article-illustrator)                       │
│   ⑤ 写 page.tsx / index.html / meta.json                     │
│   ⑥ 更新 vite.config.ts + home-data.json                     │
│   ⑦ bun run build                                            │
│   ⑧ 自审循环 (Playwright + Agent 视觉评审, 最多 3 轮)       │
│   ⑨ 系列首篇: 写 series/<name>/spec.json                     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  dist/  →  /deploy  →  rsync + nginx                         │
└─────────────────────────────────────────────────────────────┘
```

## 2. 核心架构决策 (ADRs)

### ADR-001: 不使用任何博客专用框架

**决策**: 不使用 Hugo / Jekyll / Astro / Next.js starter。

**理由**: 博客框架的本质是「内容套进同一个 theme」，而本项目要求每篇独特。框架会变成对抗力。

**代价**: 需要自建 entry 配置、路由、home data 注入——但 Vite 多页模式已经解决了这些。

**状态**: Accepted.

---

### ADR-002: Vite 多页模式 + 每篇文章一个 entry

**决策**: 采用 Vite 多页模式，每篇文章是一个独立 HTML entry（`articles/<slug>/index.html`）。

**理由**:
1. 符合「页面即作品」的哲学——每个 HTML 是一个独立构建产物
2. 文章之间完全隔离，一篇崩了不影响其它
3. 每篇可以有完全不同的技术栈组合（例如这篇用 r3f，那篇纯 CSS）
4. 构建产物是纯静态，部署只需要 rsync

**代价**: `vite.config.ts` 需要动态 entry 机制（glob 扫 `src/articles/*/index.html`）。

**状态**: Accepted.

---

### ADR-003: UI 层用 React + react-three-fiber + GSAP + Tailwind

**决策**: UI 层选用 React 18 + TypeScript，3D 用 react-three-fiber + drei，动画用 GSAP + Motion One，样式用 Tailwind。

**理由**:
1. **Claude 对这套栈最熟悉**，Agent 生成质量最高（最关键因素）
2. Tier 4 的工业标准就是 R3F + GSAP 组合
3. Tailwind 的原子类和 `clamp()` 函数对响应式友好
4. TypeScript 提供类型约束，减少 Agent 生成时的低级错误

**代价**: 每篇文章的 bundle 会包含 React（但 Vite rollup 可以共享 vendor chunk）。

**状态**: Accepted.

---

### ADR-004: 三层「标准」体系

**决策**: 用三层结构承载「独特性 vs 品质」的矛盾。

| Layer | 形态 | 位置 |
|---|---|---|
| Layer 1 · Hard Rules | 硬规则清单 | `src/standards/hard-rules.md` + `hard-rules.custom.md` |
| Layer 2 · Component Vault | 可复用 Tier 4 组件库 | `src/primitives/*` |
| Layer 3 · Reference Vault | 品味参考画廊 | `src/reference-vault/*` |

**理由**: 单一机制无法同时支撑可验证性 + 复用性 + 品味。三层分工协作：
- Hard Rules 负责「绝不出错」（可编程验证）
- Component Vault 负责「快速组合」（质量下限）
- Reference Vault 负责「品味校准」（语言无法描述的审美）

**Agent 工作流**: 生成前读 Layer 1/2，自审时对照 Layer 1/3。

**生长机制**: 三层都从空（或极小）开始，在使用中积累。

**状态**: Accepted.

---

### ADR-005: 文件夹即 Source of Truth

**决策**: 每篇文章的所有状态都由 `articles/<slug>/` 这个文件夹定义，其中 `source/` 子目录是不可变的原始输入。

**理由**:
1. 幂等性：删除除 `source/` 外的全部产物，可以从 `source/` 无损重生成
2. 可追溯：任何时候可以回看原始材料是什么
3. 便于版本管理：整个文件夹是一个自洽单元
4. Agent 的「上下文」清晰：要改这篇文章，只需要关注这一个文件夹

**代价**: 文件夹结构必须被严格约定；`source/` 一旦写入就不应被 Agent 修改。

**状态**: Accepted.

---

### ADR-006: 系列 (Series) = 首篇即规范

**决策**: 系列的 UI 规范由**首篇文章**决定。首篇自由发挥，完成后 Agent 将风格决策写入 `series/<name>/spec.json`。后续文章读取 spec 并在约束下生成。

**理由**:
1. 不用预先编写系列 theme——降低心智负担
2. 首篇是一次完整的创意过程，规范是它的副产品
3. 后续文章自动保持一致性，符合「系列内同构」的直觉

**代价**: 首篇与后续的工作量差异大。首篇的选择会锁定整个系列的视觉。

**状态**: Accepted.

---

### ADR-007: Agent 全自动 + 自审循环

**决策**: `/publish` skill 从触发到完成不需要作者中途介入。质量控制靠 Agent 自审循环：**Playwright 多断点截图 → Agent 视觉评审 → 迭代修复 → 最多 3 轮**。

**理由**:
1. 符合「vibe coding」的 UX 直觉：扔进去 → 回来看结果
2. 作者的注意力稀缺，不应被中间态打断
3. 自审循环让 Agent 「知道自己做得怎么样」——这是从 Tier 2 跃迁到 Tier 4 的关键

**失败策略**: 3 轮未通过 → 打印全部 review 历史 → 作者手工接管。不自动回退。

**状态**: Accepted.

---

### ADR-008: 站点外壳 = Corner Marker

**决策**: 站点级 UI 外壳只有两个元素：**左上角站点名**（点击回首页）+ **右上角 ⌘K 按钮**（命令面板）。无顶部导航，无底部页脚。

**理由**:
1. Tier 4 追求全屏沉浸，传统 chrome 会破坏表现力
2. 角落标记在不占视觉空间的同时保留了必要的导航入口
3. 同时避免「完全隐形」对新访客的友好度问题

**代价**: 命令面板 (⌘K) 必须做好，否则右上角按钮变成死元素。MVP 阶段可以先只支持「返回首页」。

**状态**: Accepted.

---

### ADR-009: 首页 = 生成式门户 (D) + 精选橱窗 (C)

**决策**: 首页分两段：上半段是落地满屏的 Tier 4 门户（hero 作品），下半段是精选橱窗网格。

**理由**:
1. 门户是作者的「签名作」，设定整站调性
2. 橱窗让访客快速看到文章列表和风格变化
3. 两段式避免了「纯门户没内容感」和「纯列表太平」的极端

**橱窗的细节规则**:
- 每张卡片背景：若文章有 `coverImage` → 用真实图片；否则用 `colors.primary` 填充
- `pin=true` 的文章永远排第一
- 其它按 `publishedAt` 倒序

**状态**: Accepted.

---

### ADR-010: 全端自适应是 Hard Rules R1

**决策**: 响应式被列为第一条不可协商的硬规则。所有 primitives 必须默认响应式，所有页面必须通过三断点视觉自审。

**三个断点**:
- desktop: 1920×1080
- tablet: 768×1024
- mobile: 375×812

**技术手段**:
- Tailwind `clamp()` 响应式字号
- `@use-gesture/react` 统一 pointer events (hover + touch)
- WebGL 在 mobile 上限制 DPR 和复杂度
- 布局重排而非缩放

**状态**: Accepted.

---

### ADR-011: 单仓库双分支策略

**决策**: 用一个仓库 + 两个分支区分框架和博客：
- `main` 分支 = 框架代码（可开源），`.gitignore` 排除所有个人内容
- `personal` 分支 = 框架 + 个人内容，`.gitignore` 不排除个人内容
- 两分支的 `.gitignore` 文件本身内容不同

**理由**:
1. 框架有开源价值，但作者的文章、品味参考、自定义 rules 是私人的
2. 单仓库方便框架更新和博客同步（`main → personal` 合并）
3. Git 的 `.gitignore` 可以在分支间不同，这让双分支策略成立

**工作流**:
- 日常博客工作都在 `personal` 分支
- 框架修复/增强先提交到 `main`，然后 `git merge main` 到 `personal`
- 可选：`main` 推到公开 remote，`personal` 推到私有 remote

**代价**: 需要维护两份 `.gitignore`；合并方向要注意，不能从 `personal` 合回 `main`。

**状态**: Accepted.

---

## 3. 技术栈

| 层 | 选型 | 决策依据 |
|---|---|---|
| 构建工具 | Vite 多页模式 | ADR-002 |
| UI 层 | React 18 + TypeScript | ADR-003 |
| 3D / WebGL | react-three-fiber + @react-three/drei | ADR-003 |
| 动画 | GSAP + Motion One | ADR-003 |
| 手势输入 | @use-gesture/react | ADR-010 |
| 样式 | Tailwind CSS + 自定义 CSS | ADR-003 |
| 包管理/运行时 | Bun | 性能 + TS native |
| 自审渲染 | Playwright | 成熟 + 多断点支持 |
| 自审评审 | Agent 自主视觉判断 | 直接在 skill 内完成视觉品质判断 |
| 补图 | baoyu-article-illustrator | 项目已有 skill |
| 部署 | rsync + nginx | 纯静态，SSL 已就绪 |

## 4. 目录结构

```
weid.fun/
├── src/
│   ├── primitives/              ← Component Vault (framework, 共享)
│   ├── reference-vault/         ← Reference Vault (personal, ignored in main)
│   ├── standards/
│   │   ├── hard-rules.md        ← baseline (framework)
│   │   └── hard-rules.custom.md ← 个人规则 (personal, ignored in main)
│   ├── lib/                     ← 共用工具
│   ├── home/
│   │   ├── index.html + page.tsx  ← 首页代码 (framework)
│   │   └── home-data.json         ← 文章数据 (personal)
│   └── articles/                  ← 所有文章 (personal)
│       └── <slug>/
│           ├── source/            ← 原始材料 (personal)
│           ├── assets/            ← 生成配图 (personal)
│           ├── index.html
│           ├── page.tsx
│           └── meta.json
├── series/                        ← 系列规范 (personal)
├── skills/publish/                ← /publish skill (framework)
├── scripts/                       ← 发布 + 部署脚本 (framework)
├── inbox/                         ← 文件夹模式暂存 (ignored 全部)
├── docs/                          ← 文档 (framework)
├── vite.config.ts                 ← (framework)
├── package.json                   ← (framework)
└── dist/                          ← 构建产物 (ignored 全部)
```

## 5. 部署架构

```
本地构建 (bun run build)
  ↓ rsync -av --delete
服务器: /var/www/weid.fun/
  ↓ nginx (443)
  ↓ SSL: Let's Encrypt ECC (fullchain.pem + privkey.pem)
浏览器: https://weid.fun
```

详见 `docs/deployment/2026-04-09-ssl证书部署.md`。

## 6. 演化路径

这个架构的每一层都可以独立演化：

- **Primitives 库**：持续生长，新的 Tier 4 组件加入
- **Hard Rules**：作者根据经验持续追加
- **Reference Vault**：作者不断收集新参考
- **Series 积累**：新系列 = 新的风格分支
- **框架本身**：Phase 1 是 MVP，Phase 2/3 可以加命令面板、archive、搜索等

**不会演化**的核心决策：
- 不使用博客框架（ADR-001）
- Tier 4 是唯一标准（ADR-004）
- 每篇独立 entry（ADR-002）
- 文件夹即 source of truth（ADR-005）

这些是本项目的「定义性约束」，任何未来的变化都必须尊重它们。

## 7. 开放问题

见设计 spec 的 §11「开放问题」章节。
