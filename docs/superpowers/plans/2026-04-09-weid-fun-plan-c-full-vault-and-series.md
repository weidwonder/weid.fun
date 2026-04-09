# weid.fun Plan C · Vault 扩充 + Claude Vision 自审 + 系列机制 + Personal 分支 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Plan B 的 MVP `/publish` 升级到**完整**版本：多 primitive 可用、Claude Vision 做视觉评审、系列机制生效、对话模式支持、自动补图、personal 分支建立。完成 Plan C 后，框架就算完整了。

**Architecture:** 在 Plan A + Plan B 基础上增量扩展。所有新 primitives 遵守 §3.4 响应式契约。Claude Vision 通过 Anthropic SDK 直接调用（不经过 Claude Code）。系列机制以 `series/<name>/spec.json` 为中介。Personal 分支通过调整 `.gitignore` 在同一仓库内分离。

**Tech Stack:** 继承 Plan A+B。新增：`@anthropic-ai/sdk`, 通过 Claude Code 的 baoyu-article-illustrator skill

**Spec Reference:** `docs/superpowers/specs/2026-04-09-weid-fun-blog-design.md`
**Prev Plans:** Plan A (framework), Plan B (/publish MVP)

---

## 前置条件

- ✅ Plan A tag `plan-a-complete` 存在
- ✅ Plan B tag `plan-b-complete` 存在
- ✅ 手动模拟了 `/publish inbox/hello-world`，pipeline 通畅
- ✅ 工作在 `main` 分支

---

## 文件结构预览

```
weid.fun/
├── src/
│   ├── primitives/
│   │   ├── CornerMarker/            (Plan A)
│   │   ├── WebGLHero/               (Plan B)
│   │   ├── ScrollReveal/            (新增, Task 1)
│   │   ├── DragFigure/              (新增, Task 2)
│   │   └── AudioPad/                (新增, Task 3)
│   ├── reference-vault/             (新增, Task 4)
│   │   ├── README.md
│   │   └── .gitkeep
│   └── standards/
│       ├── hard-rules.md            (Plan A, 扩充)
│       ├── hard-rules.custom.md.example (新增, Task 5)
│       └── review-prompt.md         (新增, Task 6)
├── series/
│   └── .gitkeep                     (新增, Task 10)
├── scripts/
│   ├── self-review.ts               (Modify, Task 7)
│   └── publish/
│       ├── organize-source.ts       (Plan B)
│       ├── extract-palette.ts       (Plan B)
│       ├── update-home-data.ts      (Plan B)
│       ├── vision-review.ts         (新增, Task 7)
│       ├── hard-rules-merge.ts      (新增, Task 5)
│       ├── series-read.ts           (新增, Task 10)
│       ├── series-write.ts          (新增, Task 10)
│       └── illustrate.ts            (新增, Task 11)
├── skills/publish/
│   └── SKILL.md                     (Modify, Task 8, 12, 13)
└── docs/
    └── personal-branch-setup.md     (新增, Task 14)
```

---

## Task 1: ScrollReveal Primitive

**目的**：基于滚动进度 reveal 内容的 Tier 4 组件。常用于文章的段落依次呈现。

**Files:**
- Create: `src/primitives/ScrollReveal/ScrollReveal.tsx`
- Create: `src/primitives/ScrollReveal/index.ts`
- Create: `src/playground/scroll-reveal/index.html`
- Create: `src/playground/scroll-reveal/main.tsx`
- Create: `src/playground/scroll-reveal/page.tsx`
- Create: `tests/scroll-reveal.spec.ts`

- [x] **Step 1.1: 写测试**

`tests/scroll-reveal.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test.describe('ScrollReveal primitive', () => {
  test('初始状态内容不可见（opacity ~0 或 translateY）', async ({ page }) => {
    await page.goto('/src/playground/scroll-reveal/')
    const hidden = page.locator('[data-testid="reveal-item-2"]')
    const opacity = await hidden.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(opacity).toBeLessThan(0.5)
  })

  test('滚动后内容变为可见', async ({ page }) => {
    await page.goto('/src/playground/scroll-reveal/')
    const target = page.locator('[data-testid="reveal-item-2"]')
    await target.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800) // 等动画
    const opacity = await target.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(opacity).toBeGreaterThan(0.9)
  })

  test('mobile 上也能 reveal（touch scroll）', async ({ page }) => {
    await page.goto('/src/playground/scroll-reveal/')
    const target = page.locator('[data-testid="reveal-item-2"]')
    await target.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    const opacity = await target.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(opacity).toBeGreaterThan(0.9)
  })
})
```

- [x] **Step 1.2: 写 ScrollReveal.tsx**

```tsx
import { useRef, useEffect, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  /** 触发时机：0 = 元素刚进入视口，1 = 完全进入视口。默认 0.3 */
  threshold?: number
  /** 入场偏移距离（px）。默认 40 */
  offsetY?: number
  /** 动画时长（ms）。默认 800 */
  duration?: number
  /** data-testid pass-through */
  testId?: string
}

/**
 * ScrollReveal · 滚动驱动的淡入 + 上移 primitive
 *
 * 响应式契约 (R1)：
 * - 使用 IntersectionObserver，touch 滚动同样触发
 * - 不依赖 :hover
 * - 不会产生横向滚动（仅 opacity + translateY）
 */
export function ScrollReveal({
  children,
  threshold = 0.3,
  offsetY = 40,
  duration = 800,
  testId,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 避免 SSR 时立即显示
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.unobserve(el)
          }
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : `translateY(${offsetY}px)`,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}
```

- [x] **Step 1.3: 写 index.ts**

```ts
export { ScrollReveal } from './ScrollReveal'
```

- [x] **Step 1.4: 写 playground 页面**

`src/playground/scroll-reveal/index.html`: 参考 Plan B Task 3.2 的模板。

`src/playground/scroll-reveal/main.tsx`: 参考 Plan B Task 3.3 模板，引用 `./page`。

`src/playground/scroll-reveal/page.tsx`:
```tsx
import { ScrollReveal } from '@/primitives/ScrollReveal'
import { CornerMarker } from '@/primitives/CornerMarker'

export function PlaygroundPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <CornerMarker />
      <div className="max-w-2xl mx-auto px-6 py-32 space-y-40">
        <ScrollReveal testId="reveal-item-1">
          <h2 className="text-fluid-3xl font-bold">Scroll down to reveal →</h2>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-2">
          <p className="text-fluid-lg">This paragraph appears when you scroll it into view.</p>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-3">
          <p className="text-fluid-lg">So does this one, but later.</p>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-4">
          <p className="text-fluid-lg text-neutral-500 font-mono">End of playground.</p>
        </ScrollReveal>
      </div>
    </div>
  )
}
```

- [x] **Step 1.5: 跑测试**

```bash
bun x playwright test tests/scroll-reveal.spec.ts
```

Expected: 9 test (3 × 3 project) PASS。

- [x] **Step 1.6: 提交**

```bash
git add src/primitives/ScrollReveal/ src/playground/scroll-reveal/ tests/scroll-reveal.spec.ts
git commit -m "feat(primitive): add ScrollReveal with IntersectionObserver"
```

---

## Task 2: DragFigure Primitive

**目的**：可用 mouse 或 touch 拖拽的元素。作为交互元素的基础。关键是同时处理 pointer events（桌面 + 手机统一）。

**Files:**
- Create: `src/primitives/DragFigure/DragFigure.tsx`
- Create: `src/primitives/DragFigure/index.ts`
- Create: `src/playground/drag-figure/{index.html, main.tsx, page.tsx}`
- Create: `tests/drag-figure.spec.ts`

- [x] **Step 2.1: 写测试**

```ts
import { test, expect } from '@playwright/test'

test.describe('DragFigure primitive', () => {
  test('可以通过 mouse 拖拽移动位置', async ({ page }) => {
    await page.goto('/src/playground/drag-figure/')
    const handle = page.locator('[data-testid="drag-figure"]')
    const startBox = await handle.boundingBox()
    expect(startBox).not.toBeNull()

    await handle.hover()
    await page.mouse.down()
    await page.mouse.move(startBox!.x + 150, startBox!.y + 100, { steps: 10 })
    await page.mouse.up()

    const endBox = await handle.boundingBox()
    expect(Math.abs(endBox!.x - startBox!.x)).toBeGreaterThan(100)
  })

  test('mobile 上可以 touch 拖拽', async ({ page }) => {
    await page.goto('/src/playground/drag-figure/')
    const handle = page.locator('[data-testid="drag-figure"]')
    const startBox = await handle.boundingBox()

    await page.touchscreen.tap(startBox!.x + 20, startBox!.y + 20)
    // 模拟 touch drag
    await handle.dispatchEvent('pointerdown', { clientX: startBox!.x + 20, clientY: startBox!.y + 20, pointerType: 'touch' })
    await handle.dispatchEvent('pointermove', { clientX: startBox!.x + 120, clientY: startBox!.y + 80, pointerType: 'touch' })
    await handle.dispatchEvent('pointerup', { clientX: startBox!.x + 120, clientY: startBox!.y + 80, pointerType: 'touch' })

    const endBox = await handle.boundingBox()
    expect(Math.abs(endBox!.x - startBox!.x)).toBeGreaterThan(50)
  })
})
```

- [x] **Step 2.2: 写 DragFigure.tsx（用 @use-gesture/react 统一 pointer events）**

```tsx
import { useState, type ReactNode } from 'react'
import { useDrag } from '@use-gesture/react'

interface DragFigureProps {
  children: ReactNode
  /** 初始 x 偏移 */
  initialX?: number
  /** 初始 y 偏移 */
  initialY?: number
  /** data-testid pass-through */
  testId?: string
}

/**
 * DragFigure · 可拖拽 primitive
 *
 * 使用 @use-gesture/react 的 useDrag hook，一次处理 mouse + touch + pointer。
 *
 * 响应式契约 (R1)：
 * - mouse 和 touch 都支持
 * - 触摸时不会意外触发页面滚动（touch-action: none）
 */
export function DragFigure({
  children,
  initialX = 0,
  initialY = 0,
  testId,
}: DragFigureProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY })

  const bind = useDrag(({ offset: [ox, oy] }) => {
    setPos({ x: initialX + ox, y: initialY + oy })
  })

  return (
    <div
      {...bind()}
      data-testid={testId}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: 'none',
        cursor: 'grab',
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}
```

- [x] **Step 2.3: 写 index.ts**

```ts
export { DragFigure } from './DragFigure'
```

- [x] **Step 2.4: 写 playground 页面**

`src/playground/drag-figure/page.tsx`:
```tsx
import { DragFigure } from '@/primitives/DragFigure'
import { CornerMarker } from '@/primitives/CornerMarker'

export function PlaygroundPage() {
  return (
    <div className="bg-black text-white min-h-screen relative overflow-hidden">
      <CornerMarker />
      <div className="flex items-center justify-center min-h-screen">
        <DragFigure testId="drag-figure" initialX={0} initialY={0}>
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl flex items-center justify-center font-mono text-xs uppercase tracking-wider">
            drag me
          </div>
        </DragFigure>
      </div>
    </div>
  )
}
```

index.html 和 main.tsx 参考 ScrollReveal playground 模板。

- [x] **Step 2.5: 跑测试**

```bash
bun x playwright test tests/drag-figure.spec.ts
```

Expected: 所有 test PASS。

- [x] **Step 2.6: 提交**

```bash
git add src/primitives/DragFigure/ src/playground/drag-figure/ tests/drag-figure.spec.ts
git commit -m "feat(primitive): add DragFigure with @use-gesture/react unified pointer"
```

---

## Task 3: AudioPad Primitive

**目的**：一个可播放 ambient audio 的 primitive。关键挑战是 mobile autoplay policy——没有用户交互就不能播放。解法：必须先点击触发。

**Files:**
- Create: `src/primitives/AudioPad/AudioPad.tsx`
- Create: `src/primitives/AudioPad/index.ts`
- Create: `src/playground/audio-pad/{index.html, main.tsx, page.tsx}`
- Create: `tests/audio-pad.spec.ts`

- [x] **Step 3.1: 写测试**

```ts
import { test, expect } from '@playwright/test'

test.describe('AudioPad primitive', () => {
  test('初始显示「播放」按钮', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await expect(button).toBeVisible()
    await expect(button).toContainText(/play/i)
  })

  test('点击后变为「暂停」状态', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await button.click()
    await expect(button).toContainText(/pause/i)
  })

  test('再次点击变回播放状态', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await button.click()
    await button.click()
    await expect(button).toContainText(/play/i)
  })
})
```

- [x] **Step 3.2: 写 AudioPad.tsx**

```tsx
import { useRef, useState, useEffect } from 'react'

interface AudioPadProps {
  /** 音频 URL */
  src: string
  /** 可选音量 0-1，默认 0.4 */
  volume?: number
  /** 循环播放，默认 true */
  loop?: boolean
  /** 显示用的 label */
  label?: string
}

/**
 * AudioPad · Tier 4 音频 primitive
 *
 * 必须由用户点击触发才能播放（mobile autoplay policy 要求）。
 * 不做自动播放。
 *
 * 响应式契约 (R1)：
 * - 播放按钮在所有断点可点击
 * - mobile 上点击一次即生效
 * - 提供降级：音频加载失败时显示 "audio unavailable"
 */
export function AudioPad({
  src,
  volume = 0.4,
  loop = true,
  label = 'Ambient',
}: AudioPadProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.loop = loop
  }, [volume, loop])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        await audio.play()
        setPlaying(true)
      }
    } catch {
      setError(true)
    }
  }

  if (error) {
    return (
      <div className="font-mono text-fluid-xs text-neutral-600 px-3 py-2 border border-neutral-800 rounded">
        audio unavailable
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        data-testid="audio-pad-toggle"
        onClick={toggle}
        className="
          px-4 py-2 rounded-full
          border border-neutral-600 hover:border-neutral-300
          font-mono text-fluid-xs uppercase tracking-wider
          text-neutral-300 hover:text-white
          bg-black/50 backdrop-blur-sm
          transition-colors
          cursor-pointer
        "
      >
        {playing ? `⏸ pause ${label}` : `▶ play ${label}`}
      </button>
    </div>
  )
}
```

- [x] **Step 3.3: 写 playground**

`src/playground/audio-pad/page.tsx`:
```tsx
import { AudioPad } from '@/primitives/AudioPad'
import { CornerMarker } from '@/primitives/CornerMarker'

export function PlaygroundPage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-8">
      <CornerMarker />
      <h2 className="text-fluid-2xl font-bold">Audio Pad Playground</h2>
      <AudioPad
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        label="silent test"
      />
      <p className="font-mono text-xs text-neutral-600 max-w-md text-center">
        真实使用时 src 应指向 audio 文件。playground 里用的是 1 字节 silent wav 便于测试。
      </p>
    </div>
  )
}
```

- [x] **Step 3.4: 跑测试**

```bash
bun x playwright test tests/audio-pad.spec.ts
```

Expected: 全 PASS。

- [x] **Step 3.5: 提交**

```bash
git add src/primitives/AudioPad/ src/playground/audio-pad/ tests/audio-pad.spec.ts
git commit -m "feat(primitive): add AudioPad with click-to-play for mobile compat"
```

---

## Task 4: Reference Vault 目录与模板

**目的**：创建 `src/reference-vault/` 目录和一个 README，说明如何添加参考。

**Files:**
- Create: `src/reference-vault/README.md`
- Create: `src/reference-vault/.gitkeep`

- [x] **Step 4.1: 写 README.md**

```markdown
# Reference Vault

This directory holds visual references that the self-review loop compares against.
Each reference is a pair of files:

- `<name>.jpg` (or .png/.webp) — screenshot of the reference page
- `<name>.md` — description: URL, why it's in the vault, what to learn from it

Example:

\`\`\`
src/reference-vault/
├── 001-rauno-freiberg-home.jpg
├── 001-rauno-freiberg-home.md
├── 002-bartosz-ciechanowski-gears.jpg
└── 002-bartosz-ciechanowski-gears.md
\`\`\`

## Usage by Self-Review

The Claude Vision review step (see `scripts/publish/vision-review.ts`) loads all
reference images from this directory and asks:

> "Does this new article feel like it belongs in the same family as these references?"

## Maintenance

- Add references that represent the quality bar you want
- Remove references that no longer reflect your taste
- Keep descriptions concise (3-5 sentences)
- **On main branch this directory is gitignored** — the references you collect are
  personal taste artifacts and belong on the personal branch
```

- [x] **Step 4.2: .gitkeep（main 分支会 ignore 具体内容但保留目录）**

```bash
echo "" > src/reference-vault/.gitkeep
```

Note: `.gitignore` 的规则是 `/src/reference-vault/*` with `!/src/reference-vault/.gitkeep` 和 `!README.md`。`README.md` 也要放行。检查 Plan A 的 `.gitignore`，如果 README.md 没有放行，加上：

```
!/src/reference-vault/.gitkeep
!/src/reference-vault/README.md
```

这个修改在 Task 14 statute (personal branch prep) 里一起处理。Task 4 先提交 README 和 .gitkeep。

- [x] **Step 4.3: 提交**

```bash
git add src/reference-vault/README.md src/reference-vault/.gitkeep
git commit -m "feat(vault): add reference vault directory and README"
```

---

## Task 5: Hard Rules Custom Merge 支持

**目的**：Agent 读 Hard Rules 时合并 `hard-rules.md` (baseline) + `hard-rules.custom.md` (作者追加的个人规则)。提供 example 文件作为模板。

**Files:**
- Create: `src/standards/hard-rules.custom.md.example`
- Create: `scripts/publish/hard-rules-merge.ts`

- [ ] **Step 5.1: 写 example 文件**

```markdown
# Hard Rules · Custom (Personal)

> 这个文件是你**个人**的硬规则追加。它不属于框架分支，只会在 personal 分支里存在。
>
> 复制此文件为 `hard-rules.custom.md`（去掉 `.example`）后开始编辑。
>
> Agent 自审时会把这些规则和 `hard-rules.md` (baseline R1) 合并后使用。

## R2. 示例规则 —— 必须有一个「令人记住的瞬间」

（这是示例，你可以删掉或改写）

每篇文章必须有一个瞬间——一个动画、一个交互、一个视觉震撼、一个声音——
让读者第一次看到时会「哦」一声。如果整篇文章是平的，审查不通过。

## R3. 另一个示例 —— 禁止 saas 模板感

任何页面看起来像是「AI 生成的 landing page 默认样式」的，不通过。
具体禁令：
- 纯 gradient 按钮 + glow
- 三栏 feature grid + icon
- "Trusted by" + 灰色 logo 墙
- "Hero + CTA + 社会证明" 的标准套路

## 添加你自己的规则

- 规则应该是**可验证**的（Claude Vision 能对着截图判断是否违反）
- 规则应该有**理由**（写在规则下面）
- 规则应该是**绝对**的（不允许「通常」「尽量」这种模糊词）
```

- [ ] **Step 5.2: 写 hard-rules-merge.ts**

```ts
#!/usr/bin/env bun
/**
 * hard-rules-merge.ts · 合并 baseline + custom hard rules
 *
 * Usage:
 *   bun run scripts/publish/hard-rules-merge.ts
 *
 * 输出：合并后的完整 markdown 到 stdout
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const baselinePath = path.join('src', 'standards', 'hard-rules.md')
  const customPath = path.join('src', 'standards', 'hard-rules.custom.md')

  if (!fs.existsSync(baselinePath)) {
    console.error(`Error: ${baselinePath} not found`)
    process.exit(1)
  }

  const baseline = fs.readFileSync(baselinePath, 'utf-8')
  let custom = ''
  if (fs.existsSync(customPath)) {
    custom = fs.readFileSync(customPath, 'utf-8')
  }

  const merged = [
    baseline,
    '',
    '---',
    '',
    '# Custom Rules (Personal Branch)',
    '',
    custom || '*(no custom rules)*',
  ].join('\n')

  console.log(merged)
}

main()
```

- [ ] **Step 5.3: 本地测试**

```bash
bun run scripts/publish/hard-rules-merge.ts
```

Expected: 打印 baseline 内容 + `*(no custom rules)*`（因为 custom.md 不存在，只有 .example）。

- [ ] **Step 5.4: 提交**

```bash
git add src/standards/hard-rules.custom.md.example scripts/publish/hard-rules-merge.ts
git commit -m "feat(standards): add hard rules custom merge with example"
```

---

## Task 6: Review Prompt Template

**目的**：`src/standards/review-prompt.md` 是 Claude Vision 评审时用的 prompt 模板。

**Files:**
- Create: `src/standards/review-prompt.md`

- [ ] **Step 6.1: 写 review-prompt.md**

```markdown
You are evaluating a newly generated article page for weid.fun, a personal blog where
every article is a unique Tier 4 visual experience.

You will receive:
1. A set of screenshots at three breakpoints (desktop 1920×1080, tablet 768×1024, mobile 375×812)
2. A markdown file of Hard Rules that must not be violated
3. (Optionally) a gallery of reference images representing the site's visual family

Your job is to decide: **should this article ship, or does it need revision?**

## Evaluation Criteria

### Hard Rules (pass/fail, any violation = reject)

Review the Hard Rules file carefully. For each rule, check if the screenshots violate it.
If ANY hard rule is violated, return `pass: false` with the specific violation.

### Taste Check (score 0-10)

Beyond the hard rules, consider:

- **Expressiveness**: Does this feel like a Tier 4 page (3D, interactive, scroll narrative,
  unique visual identity) or like a generic blog post?
- **Cohesion**: Does the color palette work together? Do the elements feel intentional?
- **Family resemblance** (if references provided): Does this belong in the same aesthetic
  family as the references?
- **Responsive quality**: Does the mobile view feel intentional, or like an afterthought?

Score from 0 to 10. **Require ≥ 7 to pass.**

## Output Format

Respond ONLY with valid JSON, no prose:

```json
{
  "pass": true | false,
  "score": 0-10,
  "hardRuleViolations": [
    { "rule": "R1", "description": "..." }
  ],
  "issues": [
    "specific problem 1",
    "specific problem 2"
  ],
  "suggestions": [
    "try doing X",
    "consider Y"
  ]
}
```

## Revision Suggestions

If `pass: false`, include 2-5 concrete suggestions for what to change in the page.tsx code.
Be specific: "increase hero title font size on mobile" not "improve mobile experience".
```

- [ ] **Step 6.2: 提交**

```bash
git add src/standards/review-prompt.md
git commit -m "feat(standards): add review-prompt.md for claude vision eval"
```

---

## Task 7: Claude Vision Self-Review 接入

**目的**：给 `scripts/self-review.ts` 增加一个可选的「视觉评审」阶段，用 Claude Vision API 判断质量。

**Files:**
- Create: `scripts/publish/vision-review.ts`
- Modify: `scripts/self-review.ts`

- [ ] **Step 7.1: 安装 @anthropic-ai/sdk**

```bash
bun add @anthropic-ai/sdk
```

- [ ] **Step 7.2: 写 vision-review.ts**

```ts
#!/usr/bin/env bun
/**
 * vision-review.ts · 用 Claude Vision 评审页面截图
 *
 * Usage:
 *   bun run scripts/publish/vision-review.ts <slug>
 *
 * 前置：ANTHROPIC_API_KEY 环境变量已设置
 *
 * 输出 JSON:
 *   {
 *     pass: boolean,
 *     score: number,
 *     hardRuleViolations: [{rule, description}],
 *     issues: string[],
 *     suggestions: string[]
 *   }
 */

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { spawn, type ChildProcess } from 'node:child_process'

const BREAKPOINTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

async function startPreview(): Promise<ChildProcess> {
  const proc = spawn('bun', ['run', 'preview'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('preview timeout')), 30_000)
    proc.stdout!.on('data', (data) => {
      if (data.toString().includes('Local:')) {
        clearTimeout(timeout)
        setTimeout(resolve, 500)
      }
    })
  })
  return proc
}

async function captureScreenshots(slug: string): Promise<Record<string, Buffer>> {
  const browser = await chromium.launch()
  const shots: Record<string, Buffer> = {}
  try {
    for (const bp of BREAKPOINTS) {
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } })
      const page = await ctx.newPage()
      await page.goto(`http://localhost:4173/src/articles/${slug}/`, { waitUntil: 'networkidle' })
      shots[bp.name] = await page.screenshot({ fullPage: false, type: 'png' })
      await ctx.close()
    }
  } finally {
    await browser.close()
  }
  return shots
}

async function loadReferenceVault(): Promise<Array<{ name: string; data: Buffer; desc: string }>> {
  const vault = path.join('src', 'reference-vault')
  if (!fs.existsSync(vault)) return []

  const refs: Array<{ name: string; data: Buffer; desc: string }> = []
  for (const file of fs.readdirSync(vault)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
    const base = file.replace(/\.[^.]+$/, '')
    const descPath = path.join(vault, `${base}.md`)
    const desc = fs.existsSync(descPath) ? fs.readFileSync(descPath, 'utf-8') : ''
    refs.push({
      name: base,
      data: fs.readFileSync(path.join(vault, file)),
      desc,
    })
  }
  return refs
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: vision-review.ts <slug>')
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set')
    process.exit(2)
  }

  const hardRules = require('node:child_process')
    .execSync('bun run scripts/publish/hard-rules-merge.ts')
    .toString()

  const reviewPrompt = fs.readFileSync('src/standards/review-prompt.md', 'utf-8')

  const preview = await startPreview()
  let shots: Record<string, Buffer>
  try {
    shots = await captureScreenshots(slug)
  } finally {
    preview.kill('SIGINT')
  }

  const refs = await loadReferenceVault()

  const anthropic = new Anthropic({ apiKey })

  const content: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: `# Hard Rules\n\n${hardRules}\n\n---\n\n# Review Prompt\n\n${reviewPrompt}` },
    { type: 'text', text: '\n## Screenshots of the article\n' },
  ]

  for (const bp of BREAKPOINTS) {
    content.push({ type: 'text', text: `\n**${bp.name} (${bp.width}×${bp.height})**:` })
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: shots[bp.name].toString('base64'),
      },
    })
  }

  if (refs.length > 0) {
    content.push({ type: 'text', text: '\n## Reference Vault\n' })
    for (const ref of refs) {
      content.push({ type: 'text', text: `\n**${ref.name}**: ${ref.desc.slice(0, 300)}` })
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: ref.data.toString('base64'),
        },
      })
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content }],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  // 提取 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Error: Could not parse JSON from Claude response')
    console.error('Raw response:', text)
    process.exit(3)
  }

  const review = JSON.parse(jsonMatch[0])
  console.log(JSON.stringify(review, null, 2))
  process.exit(review.pass ? 0 : 1)
}

main().catch((err) => {
  console.error('[vision-review] fatal:', err)
  process.exit(4)
})
```

- [ ] **Step 7.3: 测试（需要 ANTHROPIC_API_KEY）**

首先需要在 Task 10 之后才有真实的 article 可测。这一步**延后到 Task 12**。先提交脚本本身。

- [ ] **Step 7.4: 提交**

```bash
git add scripts/publish/vision-review.ts package.json bun.lock
git commit -m "feat(publish): add vision-review.ts with claude vision api"
```

---

## Task 8: 升级 /publish SKILL.md 支持 vision review

**目的**：在 SKILL.md 的自审循环里接入 vision-review.ts。

**Files:**
- Modify: `skills/publish/SKILL.md`

- [ ] **Step 8.1: 修改 SKILL.md 的 Step 7 （自审循环）**

找到 Plan B 写的 `### Step 7 · 自审循环`，替换为：

```markdown
### Step 7 · 自审循环（机械 + Vision 两阶段）

**阶段 1: 机械检查**

```bash
bun run scripts/self-review.ts /src/articles/<slug>/
```

读取输出 JSON。
- 若 `pass=false`：读 issues，修改 `page.tsx`，回到 Step 6 (build)
- 若 `pass=true`：进入阶段 2

**阶段 2: Claude Vision 评审（需要 ANTHROPIC_API_KEY）**

检查环境变量：
```bash
[ -n "$ANTHROPIC_API_KEY" ] && echo "ok" || echo "skip"
```

- 若 `skip`：跳过阶段 2，直接进入 Step 8。在最终报告里标注「vision review skipped (no API key)」
- 若 `ok`：运行

```bash
bun run scripts/publish/vision-review.ts <slug>
```

读取输出 JSON：
- 若 `pass=true`：进入 Step 8
- 若 `pass=false` 且已迭代 <3 次：读 suggestions，修改 `page.tsx`，回 Step 6
- 若 `pass=false` 且迭代 ≥3 次：stop。报告所有 hardRuleViolations 和 issues 给用户。

**迭代次数计数**：机械检查和 vision 评审**共享同一个迭代计数器**，总上限 3。
```

- [ ] **Step 8.2: 提交**

```bash
git add skills/publish/SKILL.md
git commit -m "feat(publish): upgrade SKILL.md self-review to two-stage"
```

---

## Task 9: /publish 对话模式支持

**目的**：让 `/publish` 不带 path 参数时，从当前 Claude Code 会话的上下文抓取 markdown + 附件。

**实现思路**：对话模式下，skill 读取 **最近用户消息的内容**作为 raw material。附件（图片）在 Claude Code 里通过工具调用的 image block 可以访问。

**关键限制**：skill 运行时，Claude 不能直接「读取用户刚才贴的东西」。解决方法：
- Claude 在执行 skill 前，先 **主动把当前对话里的 markdown 和图片** 写到一个临时 `inbox/_conversation-<timestamp>/` 目录
- 然后用文件夹模式处理

所以对话模式本质上是「自动产生一个 inbox 文件夹 + 按文件夹模式处理」。

**Files:**
- Modify: `skills/publish/SKILL.md`

- [ ] **Step 9.1: 修改 SKILL.md 的 Input Parsing 段**

找到 Plan B 写的 MVP 限制段（`Plan B 只支持文件夹模式`），替换为：

```markdown
## Input Parsing

\`/publish [path] [--series <name>] [--pin] [--slug <custom>]\`

### 文件夹模式（传 path）

用户直接指定 inbox 路径。跳到 Pipeline Steps。

### 对话模式（不传 path）

**Step A** · 从当前对话上下文抓取用户最近的 markdown 内容。这应该是用户最新的一条 user message，通常包含：
- 一段 markdown 文本（主体内容）
- 零个或多个图片附件（Claude Code 作为 image block 传入）
- 可能的指令（"发布这个"、"系列 X"等）

**Step B** · 创建临时 inbox 目录 `inbox/_conversation-<ISO-timestamp>/`：
\`\`\`bash
TS=$(date +%Y%m%dT%H%M%S)
mkdir -p inbox/_conversation-$TS/attachments
\`\`\`

**Step C** · 把对话里的 markdown 内容写到 `inbox/_conversation-$TS/raw.md`。

**Step D** · 对每个图片附件，保存到 `inbox/_conversation-$TS/attachments/<index>.<ext>`。用 Write 工具写入 base64 decode 后的 bytes。

**Step E** · 然后把这个目录当作文件夹模式的输入，进入 Pipeline Steps。
```

- [ ] **Step 9.2: 提交**

```bash
git add skills/publish/SKILL.md
git commit -m "feat(publish): add conversation mode input handling"
```

---

## Task 10: 系列机制 (spec.json)

**目的**：让系列首篇的风格决策被记录下来，系列后续文章沿用。

**Files:**
- Create: `scripts/publish/series-write.ts`
- Create: `scripts/publish/series-read.ts`
- Create: `series/.gitkeep`
- Modify: `skills/publish/SKILL.md`

- [ ] **Step 10.1: 创建 series 目录**

```bash
mkdir -p series
touch series/.gitkeep
```

- [ ] **Step 10.2: 写 series-read.ts**

```ts
#!/usr/bin/env bun
/**
 * series-read.ts · 读取系列 spec
 *
 * Usage:
 *   bun run scripts/publish/series-read.ts <series-name>
 *
 * 输出：
 * - 若系列已存在：输出 spec.json 内容到 stdout，退出码 0
 * - 若系列不存在（首篇）：输出 `FIRST` 到 stdout，退出码 0
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const name = process.argv[2]
  if (!name) {
    console.error('Usage: series-read.ts <series-name>')
    process.exit(1)
  }

  const specPath = path.join('series', name, 'spec.json')
  if (!fs.existsSync(specPath)) {
    console.log('FIRST')
    return
  }

  const spec = fs.readFileSync(specPath, 'utf-8')
  console.log(spec)
}

main()
```

- [ ] **Step 10.3: 写 series-write.ts**

```ts
#!/usr/bin/env bun
/**
 * series-write.ts · 从系列首篇文章提取风格决策写入 spec.json
 *
 * Usage:
 *   bun run scripts/publish/series-write.ts <series-name> <slug>
 *
 * 从 articles/<slug>/meta.json 和 page.tsx 提取：
 *   - colors (from meta.json)
 *   - primitives used (from page.tsx imports)
 *   - 写入 series/<series-name>/spec.json
 */

import fs from 'node:fs'
import path from 'node:path'

function extractPrimitives(pageTsxPath: string): string[] {
  const content = fs.readFileSync(pageTsxPath, 'utf-8')
  const primitives: string[] = []
  const importRe = /from\s+['"]@\/primitives\/([^'"]+)['"]/g
  let match
  while ((match = importRe.exec(content)) !== null) {
    primitives.push(match[1])
  }
  return primitives
}

function main() {
  const [seriesName, slug] = process.argv.slice(2)
  if (!seriesName || !slug) {
    console.error('Usage: series-write.ts <series-name> <slug>')
    process.exit(1)
  }

  const metaPath = path.join('src', 'articles', slug, 'meta.json')
  const pageTsxPath = path.join('src', 'articles', slug, 'page.tsx')
  if (!fs.existsSync(metaPath) || !fs.existsSync(pageTsxPath)) {
    console.error(`Error: article ${slug} not found or incomplete`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const primitives = extractPrimitives(pageTsxPath)

  const spec = {
    seriesName,
    originSlug: slug,
    createdAt: new Date().toISOString(),
    colors: meta.colors,
    primitives,
    // 未来可扩展：typography, layout skeleton, etc.
    note: 'Generated from the first article. Subsequent articles in this series should honor these constraints.',
  }

  const seriesDir = path.join('series', seriesName)
  fs.mkdirSync(seriesDir, { recursive: true })
  fs.writeFileSync(path.join(seriesDir, 'spec.json'), JSON.stringify(spec, null, 2))

  console.error(`✓ series spec written: ${seriesDir}/spec.json`)
}

main()
```

- [ ] **Step 10.4: 修改 SKILL.md 的 Pipeline Steps**

在 Step 3 (生成 page.tsx) **之前**插入一个新 step：

```markdown
### Step 2.5 · 读系列 spec

如果 `--series <name>` 被提供：

\`\`\`bash
bun run scripts/publish/series-read.ts <series-name>
\`\`\`

- 若输出 `FIRST`：本文是系列首篇。自由设计 page.tsx（按 Step 3 模板，但 primitives 和 colors 自由）。完成后，记住要在 Step 9 写 series spec。
- 若输出 JSON：读取 spec，在 Step 3 写 page.tsx 时**必须遵守**：
  - 使用 `spec.colors` 作为 meta.json.colors（覆盖 extract-palette 的结果）
  - 只使用 `spec.primitives` 列出的 primitives（不能引入新的）
```

在最后，增加 Step 9：

```markdown
### Step 9 · 若系列首篇，写 spec

如果 Step 2.5 返回了 `FIRST`，执行：

\`\`\`bash
bun run scripts/publish/series-write.ts <series-name> <slug>
\`\`\`

这会把本文的风格决策写入 `series/<series-name>/spec.json`。
```

- [ ] **Step 10.5: 提交**

```bash
git add scripts/publish/series-read.ts scripts/publish/series-write.ts series/.gitkeep skills/publish/SKILL.md
git commit -m "feat(publish): add series mechanism with spec.json read/write"
```

---

## Task 11: baoyu-article-illustrator 集成

**目的**：Agent 在管线里调 `baoyu-article-illustrator` skill 为文章补图。

**说明**：baoyu-article-illustrator 是 Claude Code 的 skill，不能在 bash 脚本里直接调。真实集成是 **Claude 在执行 /publish skill 过程中，主动调用 baoyu-article-illustrator skill**。所以这一步主要是修改 SKILL.md 的指引。

**Files:**
- Modify: `skills/publish/SKILL.md`

- [ ] **Step 11.1: 修改 SKILL.md，在 Step 2 (extract-palette) 之后插入 Step 2.7 (illustrate)**

```markdown
### Step 2.7 · 补充配图（可选）

如果用户传了 `--no-illustrate`，跳过此步。

否则，**主动调用 `baoyu-article-illustrator` skill**：

1. 读取 `articles/<slug>/source/raw.md` 作为文章内容
2. 读取 `articles/<slug>/meta.json` 的 colors.primary 作为配色参考
3. 调用 baoyu-article-illustrator skill，传入 markdown 和期望的 illustration positions
4. 让它产出 N 张图片
5. 把产出的图片保存到 `articles/<slug>/assets/`
6. 记录每张图对应 markdown 的哪段（用于 Step 3 的 page.tsx 生成）

**重要**：baoyu-article-illustrator 是独立 skill，它的调用方式见该 skill 的 SKILL.md。
/publish 不应该 reimplement 它，只负责 orchestrate 调用。

**如果 baoyu-article-illustrator 失败**：跳过，记录 warning，继续后续步骤。不要让插图步骤阻塞发布。
```

- [ ] **Step 11.2: 提交**

```bash
git add skills/publish/SKILL.md
git commit -m "feat(publish): orchestrate baoyu-article-illustrator for auto illustration"
```

---

## Task 12: 真实端到端发布测试（需要 ANTHROPIC_API_KEY）

**目的**：用一个真实的 article，跑一次完整的 `/publish` pipeline，验证所有部分协作正确。

**前置**：
- 本机 shell 有 `ANTHROPIC_API_KEY` 环境变量
- Claude Code 启动在项目根

- [ ] **Step 12.1: 创建一个 test 文章 inbox**

```bash
mkdir -p inbox/e2e-test/attachments
```

写 `inbox/e2e-test/raw.md`:
```markdown
# End-to-End Publishing Test

This article verifies the complete /publish pipeline including Claude Vision self-review.

When you read this, the following worked end-to-end:
1. organize-source.ts created the source folder
2. extract-palette.ts picked a primary color
3. Claude wrote page.tsx using the template
4. build succeeded
5. self-review.ts mechanical checks passed
6. vision-review.ts Claude Vision evaluation passed
7. home-data.json was updated

If any of these failed, you'd see an error instead of this article.
```

- [ ] **Step 12.2: 在 Claude Code 里触发 /publish**

在 Claude Code 里，输入：

```
/publish inbox/e2e-test
```

Claude Code 会调用 publish skill，按 SKILL.md 的步骤执行全流程。

期望的最终输出：

```
✅ /publish complete.

Article: articles/e2e-test/
Preview: bun run preview → http://localhost:4173/src/articles/e2e-test/
Deploy: ./scripts/deploy.sh

Self-review:
  mechanical: PASS
  vision: PASS (score: 8)
```

- [ ] **Step 12.3: 本地 preview 验证**

```bash
bun run preview
```

- 打开 `http://localhost:4173/` → 首页橱窗里能看到 e2e-test 的卡片
- 打开 `http://localhost:4173/src/articles/e2e-test/` → 文章页正确显示

- [ ] **Step 12.4: 清理 e2e-test**

```bash
rm -rf src/articles/e2e-test/ inbox/e2e-test/
```

还原 `home-data.json`：
```bash
cat > src/home/home-data.json <<'EOF'
{
  "articles": [],
  "portal": {
    "title": "A place for curious writing.",
    "subtitle": "Coming soon.",
    "lastUpdated": "2026-04-09"
  }
}
EOF
```

- [ ] **Step 12.5: git status 确认干净**

```bash
git status
```

Expected: `working tree clean`。

---

## Task 13: 最终部署验证（framework 分支）

- [ ] **Step 13.1: 把所有 Plan C 修改部署一次**

```bash
./scripts/deploy.sh
```

Expected: build + rsync + nginx reload 都成功。

- [ ] **Step 13.2: curl 验证线上**

```bash
curl -I https://weid.fun
```

Expected: `HTTP/2 200`。

- [ ] **Step 13.3: 浏览器手动验证**

打开 `https://weid.fun/` 确认仍然显示空门户（因为所有测试文章都被清理了）。

---

## Task 14: 建立 personal 分支

**目的**：创建 `personal` 分支，调整其 `.gitignore` 让个人内容被追踪。

**Files:**
- Create: `docs/personal-branch-setup.md`
- Modify (on personal branch only): `.gitignore`

- [ ] **Step 14.1: 写 docs/personal-branch-setup.md**

```markdown
# Personal Branch Setup

这份文档说明如何在 weid.fun 仓库里建立 personal 分支，用于存储个人博客内容
（文章、reference vault、custom rules 等），同时保持 main 分支作为可开源的框架。

## 背景

weid.fun 是「框架 + 博客」两用的单仓库。通过两个分支区分：

- **main** 分支：框架代码（可开源），个人内容被 `.gitignore`
- **personal** 分支：框架 + 个人内容，个人内容被追踪

两分支共享大部分代码，通过 `.gitignore` 内容不同实现分离。

## 建立步骤

### 1. 确保 main 分支是干净的

\`\`\`bash
git checkout main
git status
\`\`\`

Expected: `working tree clean`，没有未提交的个人内容。

### 2. 创建 personal 分支

\`\`\`bash
git checkout -b personal
\`\`\`

### 3. 修改 .gitignore，删除「个人内容」段

打开 `.gitignore`，找到这段：

\`\`\`
# ============================================================
# 👇 以下是「个人内容」：仅在 main (framework) 分支 ignore
# ============================================================
\`\`\`

**删除**这一段下面的所有规则（到文件末尾）。personal 分支的 .gitignore 只保留：
- 构建产物
- 依赖
- 编辑器/OS
- 环境变量
- brainstorming/superpowers 目录
- oh-my-claudecode state
- inbox 临时区

**不要删除**的：
- `/inbox/` （inbox 始终 ignore，仅作本地临时暂存）
- `/.superpowers/`
- `/.omc/`

### 4. 提交 .gitignore 修改

\`\`\`bash
git add .gitignore
git commit -m "chore(personal): relax gitignore to track personal content"
\`\`\`

### 5. 首次发布个人文章

\`\`\`bash
/publish inbox/my-first-real-article
git add articles/ series/ src/home/home-data.json src/reference-vault/ src/standards/hard-rules.custom.md
git commit -m "blog: publish my-first-real-article"
\`\`\`

## 日常工作流

### 写文章 / 博客运营 → 都在 personal 分支

\`\`\`bash
git checkout personal
# 写内容, /publish, 预览, /deploy
\`\`\`

### 框架更新 / 修 bug → 在 main 分支

\`\`\`bash
git checkout main
# 改 primitives / scripts / SKILL.md 等
git commit
\`\`\`

### 把框架更新同步到 personal

\`\`\`bash
git checkout personal
git merge main
# 解决冲突（通常只是 .gitignore，personal 的版本优先）
\`\`\`

### 不要做：从 personal 合并回 main

**禁止！** 这会把个人内容污染到 framework 分支。

## Remote 配置（可选）

如果你想把 main 公开但 personal 私有：

\`\`\`bash
# main 公开 remote
git remote add origin-public git@github.com:weidwonder/weid-fun-framework.git
git push origin-public main

# personal 私有 remote
git remote add origin-private git@github.com:weidwonder/weid-fun-blog.git  # 或 gitea/私有服务
git push origin-private personal
\`\`\`

然后可以用不同的 remote 分别推送。
```

- [ ] **Step 14.2: 提交 docs（在 main 分支）**

```bash
git add docs/personal-branch-setup.md
git commit -m "docs: add personal branch setup guide"
```

- [ ] **Step 14.3: 实际创建 personal 分支**

```bash
git checkout -b personal
```

- [ ] **Step 14.4: 修改 personal 分支的 .gitignore**

打开 `.gitignore`，找到 `# 👇 以下是「个人内容」：仅在 main (framework) 分支 ignore` 标记，删除其下所有规则到文件末尾，但保留 `/inbox/` 那一段（inbox 始终是临时的）。

验证 personal 分支的 .gitignore 长度明显比 main 短。

- [ ] **Step 14.5: 提交 personal 分支的 .gitignore**

```bash
git add .gitignore
git commit -m "chore(personal): relax gitignore to track personal content"
```

- [ ] **Step 14.6: 回到 main**

```bash
git checkout main
```

验证 main 分支的 .gitignore 仍然是完整版（包含个人内容 ignore）。

---

## Task 15: 打 tag `plan-c-complete` + 完成报告

- [ ] **Step 15.1: 打 tag**

```bash
git tag -a plan-c-complete -m "Plan C complete: full component vault, vision review, series, personal branch"
```

- [ ] **Step 15.2: 完整 git log 回顾**

```bash
git log --oneline main --decorate
```

- [ ] **Step 15.3: 报告**

```
✅ Plan C 完成。weid.fun 框架已就绪。

框架交付（main 分支）：
- Component Vault: CornerMarker + WebGLHero + ScrollReveal + DragFigure + AudioPad
- Reference Vault 基础设施
- Hard Rules: baseline + custom 合并机制
- /publish skill 完整版: folder mode + conversation mode + series + vision review
- 自审: 机械检查 + Claude Vision 两阶段
- baoyu-article-illustrator 集成
- 部署: rsync + nginx (已就绪)

Personal 分支已建立：
- .gitignore 放开个人内容
- 可以开始写第一篇真实博客文章

下一步：
- 切到 personal 分支
- /publish 你的第一篇真实文章
- git push 到私有 remote（如果设了）
- 主站 weid.fun 可访问并逐渐积累文章

Framework 开源（可选）：
- git push main 到 github.com/weidwonder/weid-fun-framework
- 别人可以 fork 然后建立自己的 personal 分支
```

---

## 附录 · Plan C 仍未做的（留给未来）

| 功能 | 原因 |
|---|---|
| 命令面板 ⌘K 完整实现 | 非 MVP；先用 CornerMarker 按钮占位 |
| Archive 页（超过 N 篇才出现） | 当前橱窗可以直接全列 |
| RSS / Atom | 非核心 |
| 文章搜索 | 非核心 |
| Analytics | 非核心 |
| HSTS | 等站点稳定后再开 |
| Primitive 开发时的 hot-reload 优化 | 需要时再改 vite 配置 |
| 更多 Tier 4 primitives | 按需增加 |

---

## 附录 · 依赖 Hall of Fame（完整栈）

完成 Plan A+B+C 后，`package.json` 的依赖：

**Dependencies:**
- react, react-dom
- three, @react-three/fiber, @react-three/drei
- @use-gesture/react
- react-markdown
- @anthropic-ai/sdk

**DevDependencies:**
- typescript, vite, @vitejs/plugin-react
- tailwindcss, autoprefixer, postcss, @tailwindcss/typography
- @playwright/test
- @types/react, @types/react-dom, @types/three
- sharp

## 附录 · 环境变量

生产使用 /publish 的 Claude Vision 评审需要：

- `ANTHROPIC_API_KEY` — 你的 Anthropic API key

在 `.env.local`（已被 gitignore）中设置：
```
ANTHROPIC_API_KEY=sk-ant-...
```

加载方式：根据你的 shell 配置（bun 会自动加载 `.env.local`）。
