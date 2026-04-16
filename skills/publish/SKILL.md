---
name: publish
description: Publish an article to weid.fun. Takes raw materials (markdown + optional directives + optional attachments), organizes them into src/articles/<slug>/source/, generates a Tier 4 page, updates the home page, and runs a self-review loop. Use when user says "publish this article" or invokes /publish.
---

# /publish · Publish an article to weid.fun

You are executing the publish pipeline for weid.fun. Follow the steps **in order**。仅在 Step -1、Phase 0 和 Step 0 内允许向用户提问；Step 1 启动后不再交互。

## Step -1 · 项目根解析（Project root resolution）

本 skill 与 weid.fun 仓库强耦合，所有后续命令都假设 CWD 在项目根。进入 Phase 0 前必须先把 CWD 固定好。

解析顺序：

1. 若环境变量 `WEID_PROJECT_ROOT` 存在，用它作为项目根
2. 否则检查当前 CWD 是否同时包含 `scripts/publish/deploy-config.ts` 和 `src/home/home-data.json`；是就用 CWD
3. 否则**询问用户**一次项目绝对路径（这是除 Phase 0 / Step 0 外唯一允许提问的时机）

拿到候选路径后，验证目录里**同时**存在下列两个文件，否则视为无效，重问或报错终止：

- `scripts/publish/deploy-config.ts`
- `src/home/home-data.json`

验证通过后执行 `cd <root>` 切进项目根；后续所有 `bun run ...`、相对路径都基于这个 CWD。用户拒绝 / 路径无效且重试失败就**终止管线**。

## Phase 0 · Intake（可选共创阶段）

Agent 在 `/publish` 触发后先对最近一条 user message 做启发式判定：

| 信号 | 判定 |
|---|---|
| 含 `#` / `##` heading，或正文 ≥ 200 中文字 / ≥ 400 英文字 | 直接模式（跳到 Input Parsing） |
| 用户同消息给了 `/publish <path>` | 直接模式 |
| 短句 + 请求动词（`帮我` / `请` / `我想` / `我要` / `help me` / `write`），或明说 `共创` / `一起写` | **共创模式** |
| 中间态（100–200 字模糊陈述） | 问一次 "要共创还是直接发布？"，按回答分支 |

### 共创循环（仅当判定为共创模式）

Phase 0 内 Agent 可自由提问、自由迭代。建议形状：

1. 两三个问题对齐主题 / 角度 / 目标读者
2. 出 3–6 段 outline 让用户确认
3. 按 outline 写完整 markdown（可用 WebFetch / Grep 项目内历史文章保持语气一致）
4. 用户改哪段改哪段；每轮改完回复末尾加 "📝 随时说'发布吧'进入管线"
5. 触发词（任一命中即进入落盘）：`发布吧` / `好了` / `go` / `ok 发` / `开始发布` / `publish`

### 共创落盘合约

触发词命中后 Agent 静默执行：

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p inbox/_conversation-$TS/attachments
```

- 最终稿 markdown 写到 `inbox/_conversation-$TS/raw.md`
- 共创中用户上传的图片附件按顺序保存到 `attachments/<index>.<ext>`
- **Agent 自己生成的讨论稿图片不放进 attachments/**（真实配图由 Step 2.7 illustrator 写到 `assets/`）
- 落盘完成后 Agent 说 "📂 素材已整理到 `inbox/_conversation-<TS>/`，开始管线…"，**自动进入 Step 0**

### 系列对齐（若涉及系列）

若共创中用户表达 "系列 / 专栏 / 第 N 篇 / series" 等意图，Phase 0 必须**在触发落盘前**与用户对齐两个值：

1. **系列 slug**（ASCII，例如 `ai-trends`）—— 用作 URL 和目录名，必须 match `^[a-z0-9][a-z0-9-]{0,59}$`
2. **系列显示名**（中文或完整标题，例如 `AI 趋势`）—— 用于渲染

这两个值 Agent 应基于上下文主动提议一组，让用户改或确认。系列首篇还应顺带收集一句可选的 **tagline**（系列简介），会写进 spec 并渲染到系列入口页。

### Phase 0 禁区

- 禁止直接写 `src/articles/*`
- 禁止修改 `home-data.json`
- 禁止跳过 inbox 直接构造 `meta.json`
- 落盘后不可逆

## Input Parsing

```bash
/publish [path] [--series-slug <slug> --series-name <displayName>] [--pin] [--slug <custom>]
```

### 文件夹模式（传 path）

用户直接指定 inbox 路径。跳到 Pipeline Steps。

### 对话模式（不传 path）

**Step A** · 从当前对话上下文抓取用户最近的 markdown 内容。这应该是用户最新的一条 user message，通常包含：
- 一段 markdown 文本（主体内容）
- 零个或多个图片附件（Claude Code 作为 image block 传入）
- 可能的指令（“发布这个”、“系列 X”等）

**Step B** · 创建临时 inbox 目录 `inbox/_conversation-<ISO-timestamp>/`：
```bash
TS=$(date +%Y%m%dT%H%M%S)
mkdir -p inbox/_conversation-$TS/attachments
```

**Step C** · 把对话里的 markdown 内容写到 `inbox/_conversation-$TS/raw.md`。

**Step D** · 对每个图片附件，保存到 `inbox/_conversation-$TS/attachments/<index>.<ext>`。用 Write 工具写入 base64 decode 后的 bytes。

**Step E** · 然后把这个目录当作文件夹模式的输入，进入 Pipeline Steps。

- `--series-slug <slug>` + `--series-name <displayName>` — 系列 slug 和显示名，**必须成对**提供；系列首篇也用这两个值；非系列文章两者都不传
- `--pin` — 是否在首页橱窗置顶
- `--slug <custom>` — 自定义 slug；不提供时从 `raw.md` 标题生成

## Pipeline Steps

### Step 0 · Preflight · 部署配置检查

先调用 deploy-config 检查机器级配置：

```bash
bun run scripts/publish/deploy-config.ts check
```

解析 stdout JSON：

- `status=ok` → 直接进入 Step 1
- `status=missing` → 读 `missing` 数组，按**只问缺的那几项**的原则，逐条询问用户（**这是 Step 1 之前唯一允许提问的时机**）。顺序固定：
  1. `WEID_DEPLOY_SERVER`（必填，例 `root@10.14.0.1`）
  2. `WEID_REMOTE_PATH`（可选，默认 `/var/www/weid.fun/`）
  3. `WEID_SITE_URL`（必填，默认 `https://weid.fun`）
  收集完后用 `Y/n` 确认一次，用户拒绝 / Ctrl+C 就**终止管线**，什么都不写。
- 确认后把收集到的键值组成 JSON，通过 stdin 传给：

```bash
echo '<JSON>' | bun run scripts/publish/deploy-config.ts save
```

保存成功后**重新**运行 `check`，拿到 `status=ok` 再进入 Step 1。

- `status=error`（文件损坏）→ 停下来，把 `message` 字段贴给用户，让用户手动修或删 `~/.config/weid.fun/deploy.env`。

### Step 1 · 组织 source

运行：
```bash
bun run scripts/publish/organize-source.ts <inbox-path> [--slug <custom>] [--series-slug <slug> --series-name <displayName>] [--pin]
```

这个脚本会：
- 在 `src/articles/<slug>/source/` 下复制 `inbox/<name>/*`
- 生成 `src/articles/<slug>/meta.json` 初版（title / slug / series / seriesName / pin / publishedAt）

**从脚本 stdout 读取 slug**，脚本会打印 `SLUG=<value>`。

**注意**：`--series-slug` 和 `--series-name` **必须同时提供**，否则脚本报错退出。

### Step 2 · 提取色彩

```bash
bun run scripts/publish/extract-palette.ts <slug>
```

这个脚本会从 `src/articles/<slug>/source/attachments/` 的第一张图提取主色，写回 `meta.json.colors`。如果没有图片，使用默认色（`#8338ec`）。

### Step 2.5 · 读系列 spec

如果 `--series-slug <slug>` 被提供：

```bash
bun run scripts/publish/series-read.ts <series-slug>
```

- 若输出 `FIRST`：本文是系列首篇。自由设计 `page.tsx`（按 Step 3 模板，但 primitives 和 colors 自由）。完成后，Step 11 会写 series spec 并生成系列入口页。
- 若输出 JSON：读取 spec，在 Step 3 写 `page.tsx` 时**必须遵守**：
  - 使用 `spec.colors` 作为 `meta.json.colors`（覆盖 extract-palette 的结果）
  - 只使用 `spec.primitives` 列出的 primitives（不能引入新的）
  - `meta.seriesName` 必须与 `spec.seriesName` 一致（脚本 organize-source 已保证，Agent 不需再改）

### Step 2.7 · 补充配图（可选）

如果用户传了 `--no-illustrate`，跳过此步。

否则，**主动调用 `baoyu-article-illustrator` skill**：

1. 读取 `src/articles/<slug>/source/raw.md` 作为文章内容
2. 读取 `src/articles/<slug>/meta.json` 的 `colors.primary` 作为配色参考
3. 调用 `baoyu-article-illustrator` skill，传入 markdown 和期望的 illustration positions
4. 让它产出 N 张图片
5. 把产出的图片保存到 `src/articles/<slug>/assets/`
6. 记录每张图对应 markdown 的哪段（用于 Step 3 的 `page.tsx` 生成）

**重要**：`baoyu-article-illustrator` 是独立 skill，它的调用方式见该 skill 的 `SKILL.md`。
`/publish` 不应该 reimplement 它，只负责 orchestrate 调用。

**如果 baoyu-article-illustrator 失败**：跳过，记录 warning，继续后续步骤。不要让插图步骤阻塞发布。

### Step 3 · 生成 page.tsx

Read `src/articles/<slug>/source/raw.md` 和 `src/articles/<slug>/meta.json`。然后**你亲自**写 `src/articles/<slug>/page.tsx`。

**必须遵守的模板**（MVP，每篇文章结构相同）：

```tsx
import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'
import type { ArticleMeta } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import meta from './meta.json'

const articleMeta = meta as ArticleMeta
const articleContent = `<这里粘贴 raw.md 的完整内容>`

export function ArticlePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title={articleMeta.title}
        subtitle={articleMeta.series || undefined}
        primaryColor={articleMeta.colors.primary}
        bgColor={articleMeta.colors.bg}
      />
      <article className="prose prose-invert prose-lg mx-auto max-w-3xl px-6 py-20">
        <ReactMarkdown>{articleContent}</ReactMarkdown>
      </article>
    </div>
  )
}
```

**重要**：
- 把 `raw.md` 的全部内容**字符串化**（处理反引号、换行），填入 `articleContent`
- 不要修改 `meta.json` 的内容
- 只使用 `CornerMarker` 和 `WebGLHero` 两个 primitive（Plan C 会扩展）
- 如果 Step 2.7 生成了 `assets/`，必须在 `page.tsx` 里实际消费这些素材；不要只生成不使用

### Step 4 · 写 index.html 和 main.tsx

**`src/articles/<slug>/index.html`**:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title><meta.title> · weid.fun</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

把 `<meta.title>` 替换为实际标题。

**`src/articles/<slug>/main.tsx`**:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArticlePage } from './page'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArticlePage />
  </React.StrictMode>
)
```

### Step 5 · 更新 home-data.json

```bash
bun run scripts/publish/update-home-data.ts <slug>
```

这会把 `meta.json` 的内容追加到 `src/home/home-data.json.articles[]`。

### Step 6 · 构建

```bash
bun run build
```

期望：没有构建错误。如果有，**不要 escalate**，而是读错误消息修 `page.tsx` 直到构建通过。

### Step 7 · 自审循环（机械 + 视觉评审 两阶段）

**阶段 1: 机械检查**

```bash
bun run scripts/self-review.ts /src/articles/<slug>/
```

读取输出 JSON。
- 若 `pass=false`：读 issues，修改 `page.tsx`，回到 Step 6（build）
- 若 `pass=true`：进入阶段 2

**阶段 2: Agent 视觉评审（不依赖厂商 API）**

先运行：

```bash
bun run scripts/publish/vision-review.ts <slug> [--kind article|series]
```

`--kind` 默认为 `article`（对应 `/src/articles/<slug>/`）。系列首篇在 Step 11c 会再跑一次 `--kind series`（对应 `/src/series/<series-slug>/`）给系列入口页做评审。

这个脚本只会准备评审材料并输出 JSON，包含：
- `sessionDir`：当前文章这轮自审的稳定工作目录
- 三个断点截图的绝对路径
- 合并后的 hard rules 文件路径
- review prompt 文件路径
- reference vault 图片和说明文件路径
- `agentVerdictPath`：你必须把自己的视觉评审 JSON 写到这里
- `iterationPath`：共享迭代计数器，机械检查和视觉评审都用它

然后你必须亲自完成视觉评审：
1. 读取这个 JSON
2. 读取 `hardRulesPath` 和 `reviewPromptPath`
3. 用 `view_image` 查看每张 screenshot
4. 若 `references` 非空：对每张 reference image 也用 `view_image` 查看；若有 `notesPath`，再读取说明
5. 读取 `iterationPath`，若文件不存在则视为 `0`；进入阶段 2 前把计数 `+1` 并写回
6. 根据这些材料，产出一个**内部使用**的评审 JSON，格式必须是：

```json
{
  "pass": true,
  "hardRuleViolations": [
    {
      "rule": "R1",
      "description": "..."
    }
  ],
  "issues": ["..."],
  "suggestions": ["..."]
}
```

判定规则：
- 任何明确 hard rule 违规，都应强烈倾向于 `pass=false`
- 优先抓响应式问题、层级问题、视觉节奏问题、移动端可用性问题
- 如果页面明显有“AI 套模板感”，直接记为 issue
- 如果 reference vault 存在，判断新页面是否属于同一视觉家族

7. 把这个 JSON 写到 `agentVerdictPath`

读取你自己的评审 JSON：
- 若 `pass=true`：进入 Step 8
- 若 `pass=false` 且已迭代 <3 次：读 `suggestions`，修改 `page.tsx`，回到 Step 6
- 若 `pass=false` 且迭代 ≥3 次：stop。报告所有 `hardRuleViolations` 和 `issues` 给用户

**迭代次数计数**：机械检查和 vision 评审共享同一个迭代计数器，总上限 3。

### Step 8 · Deploy

加载部署配置到当前 shell 并执行 `scripts/deploy.sh`：

```bash
eval "$(bun run scripts/publish/deploy-config.ts load)" && ./scripts/deploy.sh --yes
```

**失败处理（此步不进入 iteration counter）**：

- rsync / ssh / nginx reload 任一失败都直接停止整个管线，**不重试**、**不回滚**
- 把 stderr 尾 20 行贴给用户（可在执行时 `2>&1 | tee .tmp/publish-deploy.log`，失败后 `tail -n 20 .tmp/publish-deploy.log`）
- **不进入 Step 9–11**

成功后进入 Step 9。

### Step 9 · 线上 Smoke Test

```bash
eval "$(bun run scripts/publish/deploy-config.ts load)" && bun run scripts/publish/smoke-test.ts <slug>
```

读取 stdout JSON：

- `pass=true` → 进入 Step 10
- `pass=false` → 记 warning（**不是 error**），依然进入 Step 10 报告，但把整体状态标成 ⚠️ "deployed but unverified"，在报告里列出 failed checks 的 url 和 reason

Smoke test 不进入 iteration counter，不重试，不回滚。

### Step 10 · 完成报告

输出格式（根据 Step 9 结果二选一）：

Step 9 pass：

```text
✅ /publish complete.

Article: src/articles/<slug>/
Live: <WEID_SITE_URL>/src/articles/<slug>/
Deployed to: <WEID_DEPLOY_SERVER>:<WEID_REMOTE_PATH>
Smoke test: ✓ 2/2 checks passed
```

Step 9 warning（pass=false）：

```text
⚠️ /publish deployed but unverified.

Article: src/articles/<slug>/
Live: <WEID_SITE_URL>/src/articles/<slug>/
Deployed to: <WEID_DEPLOY_SERVER>:<WEID_REMOTE_PATH>
Smoke test:
  ✗ <url>  reason: <reason>
  ✓ <url>

Please verify manually.
```

### Step 11 · 若系列首篇，写 spec + 生成系列入口页

如果 Step 2.5 返回了 `FIRST`，依次执行：

```bash
bun run scripts/publish/series-write.ts <series-slug> <article-slug>
bun run scripts/publish/series-create-page.ts <series-slug>
```

作用：

1. `series-write.ts` 从首篇的 `meta.json` 提取 colors / seriesName / seriesTagline 和从 `page.tsx` 扫出 primitives，写入 `src/series/<series-slug>/spec.json`
2. `series-create-page.ts` 在同目录下生成 `index.html` / `main.tsx` / `page.tsx` —— 系列入口页，会运行时从 `home-data.json` 过滤本系列文章并按发布时间倒序列出。**副作用**：脚本末尾会自动执行 `update-home-data.ts --series-only`，把本系列 materialize 到 `home-data.json.series[]`，首页 SeriesRail 随即出现。Agent 不需要再手动触发。

生成完后需要**再跑一次 `bun run build`** 让 vite 发现新的 entry。

**Step 11c · 系列入口页视觉评审（仅首篇）**：build 通过后，对系列入口页再跑一次 Step 7 的视觉评审循环，命令替换为：

```bash
bun run scripts/publish/vision-review.ts <series-slug> --kind series
```

流程与 Step 7 阶段 2 完全一致（读 screenshots / 写 agentVerdict），共享同一个 iteration 计数器。入口页评审通过后再进入 Step 8 deploy。

**系列首篇的实际执行顺序**：

```
Step 1  organize-source (传 --series-slug + --series-name)
Step 2  extract-palette
Step 2.5 series-read → FIRST
Step 2.7 illustrator (可选)
Step 3  写文章 page.tsx
Step 4  写文章 index.html + main.tsx
Step 5  update-home-data
Step 11a series-write           ← 首篇额外
Step 11b series-create-page     ← 首篇额外（自动刷新 home series）
Step 6  bun run build
Step 7  文章自审（--kind article，默认）
Step 11c 系列入口页自审（--kind series）  ← 首篇额外
Step 8+ deploy / smoke / 报告
```

## 禁令

- **允许交互的阶段仅限 Phase 0 和 Step 0**（共创 + 配置首问）。Step 1 启动后不再向用户提问。
- **不要**跳过任何 step
- **不要**修改 `src/articles/<slug>/source/` 下的任何文件（source 是不可变的）
- **不要**在 Step 8 / Step 9 失败后自动 retry（deploy 层失败不进入 iteration counter）
- **不要**自动回滚任何文件（本地 + 远端都不回滚）
- **不要**commit（让用户自己决定是否 commit）
