---
name: publish
description: Publish an article to weid.fun. Takes raw materials (markdown + optional directives + optional attachments), organizes them into articles/<slug>/source/, generates a Tier 4 page, updates the home page, and runs a self-review loop. Use when user says "publish this article" or invokes /publish.
---

# /publish · Publish an article to weid.fun

You are executing the publish pipeline for weid.fun. Follow the steps **in order**, do NOT skip, do NOT interact with the user mid-flow.

## Input Parsing

```bash
/publish [path] [--series <name>] [--pin] [--slug <custom>]
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

- `--series <name>` — 系列名
- `--pin` — 是否在首页橱窗置顶
- `--slug <custom>` — 自定义 slug；不提供时从 `raw.md` 标题生成

## Pipeline Steps

### Step 1 · 组织 source

运行：
```bash
bun run scripts/publish/organize-source.ts <inbox-path> [--slug <custom>] [--series <name>] [--pin]
```

这个脚本会：
- 在 `articles/<slug>/source/` 下复制 `inbox/<name>/*`
- 生成 `articles/<slug>/meta.json` 初版（title / slug / series / pin / publishedAt）

**从脚本 stdout 读取 slug**，脚本会打印 `SLUG=<value>`。

### Step 2 · 提取色彩

```bash
bun run scripts/publish/extract-palette.ts <slug>
```

这个脚本会从 `articles/<slug>/source/attachments/` 的第一张图提取主色，写回 `meta.json.colors`。如果没有图片，使用默认色（`#8338ec`）。

### Step 2.5 · 读系列 spec

如果 `--series <name>` 被提供：

```bash
bun run scripts/publish/series-read.ts <series-name>
```

- 若输出 `FIRST`：本文是系列首篇。自由设计 `page.tsx`（按 Step 3 模板，但 primitives 和 colors 自由）。完成后，记住要在 Step 9 写 series spec。
- 若输出 JSON：读取 spec，在 Step 3 写 `page.tsx` 时**必须遵守**：
  - 使用 `spec.colors` 作为 `meta.json.colors`（覆盖 extract-palette 的结果）
  - 只使用 `spec.primitives` 列出的 primitives（不能引入新的）

### Step 2.7 · 补充配图（可选）

如果用户传了 `--no-illustrate`，跳过此步。

否则，**主动调用 `baoyu-article-illustrator` skill**：

1. 读取 `articles/<slug>/source/raw.md` 作为文章内容
2. 读取 `articles/<slug>/meta.json` 的 `colors.primary` 作为配色参考
3. 调用 `baoyu-article-illustrator` skill，传入 markdown 和期望的 illustration positions
4. 让它产出 N 张图片
5. 把产出的图片保存到 `articles/<slug>/assets/`
6. 记录每张图对应 markdown 的哪段（用于 Step 3 的 `page.tsx` 生成）

**重要**：`baoyu-article-illustrator` 是独立 skill，它的调用方式见该 skill 的 `SKILL.md`。
`/publish` 不应该 reimplement 它，只负责 orchestrate 调用。

**如果 baoyu-article-illustrator 失败**：跳过，记录 warning，继续后续步骤。不要让插图步骤阻塞发布。

### Step 3 · 生成 page.tsx

Read `articles/<slug>/source/raw.md` 和 `articles/<slug>/meta.json`。然后**你亲自**写 `articles/<slug>/page.tsx`。

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

### Step 4 · 写 index.html 和 main.tsx

**`articles/<slug>/index.html`**:
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

**`articles/<slug>/main.tsx`**:
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
bun run scripts/publish/vision-review.ts <slug>
```

这个脚本只会准备评审材料并输出 JSON，包含：
- 三个断点截图的绝对路径
- 合并后的 hard rules 文件路径
- review prompt 文件路径
- reference vault 图片和说明文件路径

然后你必须亲自完成视觉评审：
1. 读取这个 JSON
2. 读取 `hardRulesPath` 和 `reviewPromptPath`
3. 用 `view_image` 查看每张 screenshot
4. 若 `references` 非空：对每张 reference image 也用 `view_image` 查看；若有 `notesPath`，再读取说明
5. 根据这些材料，产出一个**内部使用**的评审 JSON，格式必须是：

```json
{
  "pass": true,
  "score": 0,
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

读取你自己的评审 JSON：
- 若 `pass=true`：进入 Step 8
- 若 `pass=false` 且已迭代 <3 次：读 `suggestions`，修改 `page.tsx`，回到 Step 6
- 若 `pass=false` 且迭代 ≥3 次：stop。报告所有 `hardRuleViolations` 和 `issues` 给用户

**迭代次数计数**：机械检查和 vision 评审共享同一个迭代计数器，总上限 3。

### Step 8 · 完成报告

输出：
```text
✅ /publish complete.

Article: articles/<slug>/
Preview: bun run preview → http://localhost:4173/src/articles/<slug>/
Deploy: ./scripts/deploy.sh
```

### Step 9 · 若系列首篇，写 spec

如果 Step 2.5 返回了 `FIRST`，执行：

```bash
bun run scripts/publish/series-write.ts <series-name> <slug>
```

这会把本文的风格决策写入 `series/<series-name>/spec.json`。

## 禁令

- **不要**在管线中询问用户任何问题
- **不要**跳过任何 step
- **不要**修改 `articles/<slug>/source/` 下的任何文件（source 是不可变的）
- **不要**自动触发 deploy
- **不要**commit（让用户自己决定是否 commit）
