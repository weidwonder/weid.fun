---
name: publish
description: Publish an article to weid.fun. Takes raw materials (markdown + optional directives + optional attachments), organizes them into articles/<slug>/source/, generates a Tier 4 page, updates the home page, and runs a self-review loop. Use when user says "publish this article" or invokes /publish.
---

# /publish · Publish an article to weid.fun

You are executing the publish pipeline for weid.fun. Follow the steps **in order**, do NOT skip, do NOT interact with the user mid-flow.

## Input Parsing

The user invokes you as:

```bash
/publish [path] [--series <name>] [--pin] [--slug <custom>]
```

- `path` — 若提供：文件夹模式，从 `path` 读取 raw materials。若不提供：对话模式（Plan B 不支持对话模式，请直接提示用户使用文件夹模式）。
- `--series <name>` — 系列名
- `--pin` — 是否在首页橱窗置顶
- `--slug <custom>` — 自定义 slug；不提供时从 `raw.md` 标题生成

**MVP 限制**：Plan B 只支持**文件夹模式**。若用户没传 path，回复：
> Plan B 只支持文件夹模式。请把材料整理到 `inbox/<your-name>/` 后再运行：
> `/publish inbox/<your-name>`

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

### Step 7 · 自审循环

```bash
bun run scripts/self-review.ts /src/articles/<slug>/
```

读取输出 JSON。
- 若 `pass=true`：进入 Step 8
- 若 `pass=false` 且已迭代 <3 次：读 issues，修改 `page.tsx`，回到 Step 6
- 若 `pass=false` 且迭代 ≥3 次：stop。报告给用户：

> `/publish` failed self-review after 3 iterations. Issues:
> [list of issues]
>
> The article folder is at `articles/<slug>/`. You can inspect `page.tsx` and fix manually.

### Step 8 · 完成报告

输出：
```text
✅ /publish complete.

Article: articles/<slug>/
Preview: bun run preview → http://localhost:4173/src/articles/<slug>/
Deploy: ./scripts/deploy.sh
```

## 禁令

- **不要**在管线中询问用户任何问题
- **不要**跳过任何 step
- **不要**修改 `articles/<slug>/source/` 下的任何文件（source 是不可变的）
- **不要**自动触发 deploy
- **不要**commit（让用户自己决定是否 commit）
