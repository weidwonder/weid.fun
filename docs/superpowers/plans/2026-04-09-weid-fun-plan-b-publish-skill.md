# weid.fun Plan B · /publish Skill + 首个 Tier 4 Primitive + 自审 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `/publish` skill 的 MVP 版本——可以通过 `/publish inbox/<name>` 发布一篇使用真实 WebGL hero 的测试文章，并通过机械自审（无 Claude Vision，留给 Plan C）。

**Architecture:** `/publish` skill 以 Claude Code skill 形式存在（`skills/publish/SKILL.md`），orchestrate 一组 Bun 脚本（`scripts/publish/*.ts`）完成「组织 source → 选色 → 生成 page.tsx → 更新 home-data → 构建 → 自审 → 报告」的管线。本 Plan 的自审是 Playwright + 机械检查（无横向滚动、关键元素存在、build 成功），Claude Vision 版留给 Plan C。

**Tech Stack:** 继承 Plan A。新增：`@react-three/fiber`, `@react-three/drei`, `three`, `@use-gesture/react`

**Spec Reference:** `docs/superpowers/specs/2026-04-09-weid-fun-blog-design.md`
**Prev Plan:** Plan A — `docs/superpowers/plans/2026-04-09-weid-fun-plan-a-framework-bootstrap.md`

---

## 前置条件

- ✅ Plan A 已执行，tag `plan-a-complete` 存在
- ✅ `https://weid.fun` 可访问，显示空门户
- ✅ 工作在 `main` 分支

## 架构设计 · `/publish` Pipeline

```
/publish inbox/<name> [--series <s>] [--pin] [--slug <custom>]
           │
           ▼
skills/publish/SKILL.md 指导 Claude 执行：
  ① bun run scripts/publish/organize-source.ts <inbox-path> <slug>
     → 复制 inbox/<name>/* 到 articles/<slug>/source/
     → 生成 articles/<slug>/meta.json 初版（slug/title/series/pin）
  ② bun run scripts/publish/extract-palette.ts <slug>
     → 从 source/attachments 的第一张图提取主色
     → 回填 meta.json.colors
  ③ Claude 读取 source/raw.md + meta.json，生成 articles/<slug>/page.tsx
     → 模板：WebGLHero + 文章 markdown 渲染（react-markdown）
     → 使用 meta.json.colors.primary 作为 hero 主色
  ④ Claude 写 articles/<slug>/index.html (template)
  ⑤ bun run scripts/publish/update-home-data.ts <slug>
     → 把 meta.json 的内容追加到 src/home/home-data.json
  ⑥ bun run build
  ⑦ bun run scripts/self-review.ts <slug>
     → Playwright 三断点访问 /articles/<slug>/
     → 机械检查：无 overflow-x、data-testid 齐全、console 无 error、build 成功
     → 返回 { pass: bool, issues: [...] }
  ⑧ 若 pass=false 且 iter<3：Claude 读 issues → 修改 page.tsx → 回 ⑥
  ⑨ 报告：文章路径 + preview URL
```

---

## 文件结构预览

```
weid.fun/
├── skills/
│   └── publish/
│       └── SKILL.md                    (新增, Task 5)
├── scripts/
│   ├── deploy.sh                       (Plan A)
│   ├── self-review.ts                  (新增, Task 4)
│   └── publish/
│       ├── organize-source.ts          (新增, Task 6)
│       ├── extract-palette.ts          (新增, Task 7)
│       └── update-home-data.ts         (新增, Task 8)
├── src/
│   ├── primitives/
│   │   ├── CornerMarker/               (Plan A)
│   │   └── WebGLHero/                  (新增, Task 2)
│   │       ├── WebGLHero.tsx
│   │       ├── WebGLScene.tsx          (内部：Three.js scene)
│   │       └── index.ts
│   ├── articles/                       (新增空目录)
│   └── home/Portal.tsx                 (Modify, Task 3)
├── inbox/
│   └── hello-world/                    (新增测试材料, Task 10)
│       ├── raw.md
│       └── attachments/cover.jpg
└── articles/
    └── hello-world/                    (自动生成, Task 10)
```

---

## Task 1: 安装 Tier 4 依赖

**Files:** `package.json`, `bun.lock`

- [x] **Step 1.1: 安装依赖**

Run:
```bash
bun add three @react-three/fiber @react-three/drei @use-gesture/react react-markdown
bun add -d @types/three
```

Expected: package.json 新增 4 个 dependency + 1 个 devDependency。

- [x] **Step 1.2: 确认 tsc 无错**

Run:
```bash
bun x tsc --noEmit
```

Expected: 无错误。

- [x] **Step 1.3: 提交**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add three/r3f/drei/use-gesture/react-markdown for tier 4"
```

---

## Task 2: WebGLHero Primitive（首个 Tier 4 组件，TDD）

**目的**：建立 Tier 4 primitive 的样板——响应式 + mobile DPR 限制 + 可配置色彩。这是所有后续 primitives 的模板。

**Files:**
- Create: `src/primitives/WebGLHero/WebGLScene.tsx`
- Create: `src/primitives/WebGLHero/WebGLHero.tsx`
- Create: `src/primitives/WebGLHero/index.ts`
- Create: `tests/webgl-hero.spec.ts`

### 2a. 先写测试

- [x] **Step 2.1: 写 tests/webgl-hero.spec.ts**

```ts
import { test, expect } from '@playwright/test'

// 临时测试页面：用于在没有文章的情况下验证 WebGLHero
// 实际上我们会在 Task 9 创建一个 playground 页面
// 这里先定义契约

test.describe('WebGLHero primitive', () => {
  test('canvas 元素挂载成功', async ({ page }) => {
    await page.goto('/playground/webgl-hero/')
    const canvas = page.locator('[data-testid="webgl-hero"] canvas')
    await expect(canvas).toBeVisible()
  })

  test('hero 满视口', async ({ page }) => {
    await page.goto('/playground/webgl-hero/')
    const hero = page.locator('[data-testid="webgl-hero"]')
    const box = await hero.boundingBox()
    const viewport = page.viewportSize()!
    expect(Math.abs(box!.height - viewport.height)).toBeLessThanOrEqual(2)
  })

  test('标题文字可见', async ({ page }) => {
    await page.goto('/playground/webgl-hero/')
    await expect(page.locator('[data-testid="webgl-hero-title"]')).toBeVisible()
  })

  test('mobile 不出现横向滚动', async ({ page }) => {
    await page.goto('/playground/webgl-hero/')
    const hasHscroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHscroll).toBe(false)
  })
})
```

### 2b. 实现 WebGLScene.tsx（Three.js scene）

- [x] **Step 2.2: 写 WebGLScene.tsx**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WebGLSceneProps {
  primaryColor: string
  isMobile: boolean
}

/**
 * WebGLScene · Three.js scene，由 WebGLHero 包装在 Canvas 里
 *
 * 当前效果：一个飘动的 color blob（shader-based gradient sphere）。
 * 未来可以替换为任何 Three.js scene。
 *
 * mobile 优化：
 * - 粒子数更少
 * - geometry segments 降档
 */
export function WebGLScene({ primaryColor, isMobile }: WebGLSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(primaryColor) },
    }),
    [primaryColor]
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05
      uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  const segments = isMobile ? 32 : 96

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, segments, segments]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPos;
            uniform float uTime;
            void main() {
              vNormal = normal;
              vec3 p = position;
              float wave = sin(uTime * 0.5 + position.x * 2.0) * 0.08;
              p += normal * wave;
              vPos = p;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPos;
            uniform vec3 uColor;
            uniform float uTime;
            void main() {
              float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 2.0);
              vec3 color = mix(uColor * 0.4, uColor, fresnel);
              color += 0.15 * sin(uTime + vPos.x * 3.0);
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>
    </>
  )
}
```

### 2c. 实现 WebGLHero.tsx（React wrapper）

- [x] **Step 2.3: 写 WebGLHero.tsx**

```tsx
import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGLScene } from './WebGLScene'

interface WebGLHeroProps {
  /** 主标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** Hero 色调（CSS 颜色字符串） */
  primaryColor?: string
  /** 背景色（CSS 颜色字符串） */
  bgColor?: string
}

/**
 * WebGLHero · Tier 4 hero primitive
 *
 * 满屏的 WebGL scene + 覆盖在上面的标题文字。
 *
 * 响应式契约 (R1)：
 * - 满视口（100vh）
 * - Canvas 自动适配容器尺寸
 * - mobile DPR 限制到 1.5（省电 + 降负载）
 * - mobile 降档 geometry 复杂度
 * - 标题字号使用 Tailwind fluid text
 */
export function WebGLHero({
  title,
  subtitle,
  primaryColor = '#8338ec',
  bgColor = '#000000',
}: WebGLHeroProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section
      data-testid="webgl-hero"
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <Canvas
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: !isMobile }}
      >
        <WebGLScene primaryColor={primaryColor} isMobile={isMobile} />
      </Canvas>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center"
        style={{ color: '#fff' }}
      >
        <h1
          data-testid="webgl-hero-title"
          className="font-sans font-bold text-fluid-3xl md:text-fluid-4xl leading-none tracking-tight max-w-[90vw]"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 font-mono text-fluid-xs tracking-wider uppercase opacity-70">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
```

- [x] **Step 2.4: 写 index.ts**

```ts
export { WebGLHero } from './WebGLHero'
```

- [x] **Step 2.5: 提交 primitive 本身（测试此时还失败，因为 playground 页面不存在）**

```bash
git add src/primitives/WebGLHero/ tests/webgl-hero.spec.ts
git commit -m "feat(primitive): add WebGLHero with r3f, shader, mobile DPR limit"
```

---

## Task 3: 创建 playground 页面验证 WebGLHero

**目的**：一个不是文章的页面，仅用于展示和测试 primitives。这也让 WebGLHero 的 Playwright 测试能跑起来。

**Files:**
- Create: `src/playground/webgl-hero/index.html`
- Create: `src/playground/webgl-hero/main.tsx`
- Create: `src/playground/webgl-hero/page.tsx`

> **注**：playground 是框架分支的永久资产（用于开发时快速验证 primitives）。会被 Vite 的 `discoverEntries` 自动发现。

- [x] **Step 3.1: 扩展 vite.config.ts 支持 playground**

修改 `vite.config.ts` 的 `discoverEntries`，在 articles 之后追加 playground 扫描：

```ts
  // ... 已有 articles 扫描代码 ...

  const playgroundRoot = path.resolve(__dirname, 'src/playground')
  if (fs.existsSync(playgroundRoot)) {
    for (const item of fs.readdirSync(playgroundRoot, { withFileTypes: true })) {
      if (!item.isDirectory()) continue
      const entry = path.join(playgroundRoot, item.name, 'index.html')
      if (fs.existsSync(entry)) {
        entries[`playground_${item.name}`] = entry
      }
    }
  }
```

- [x] **Step 3.2: 写 src/playground/webgl-hero/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Playground · WebGLHero</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/playground/webgl-hero/main.tsx"></script>
  </body>
</html>
```

> **关键**：Vite 的 entry 输出路径是由 input key 决定的。`playground_webgl-hero` 这个 key 会产出 `dist/src/playground/webgl-hero/index.html`。这意味着 URL 需要是 `/src/playground/webgl-hero/`。但我们希望 URL 是 `/playground/webgl-hero/`。需要用 Vite 的 `build.rollupOptions.output` 的 entryFileNames/assetFileNames 控制，或者直接接受 URL 有 `/src/` 前缀。

**决定**：playground 接受 URL 前缀 `/src/playground/webgl-hero/`（它是开发辅助，不面向终端用户），但测试页面访问路径也相应调整。

修改 `tests/webgl-hero.spec.ts` 里的 `page.goto('/playground/webgl-hero/')` 为 `page.goto('/src/playground/webgl-hero/')`。

- [x] **Step 3.3: 写 src/playground/webgl-hero/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PlaygroundPage } from './page'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlaygroundPage />
  </React.StrictMode>
)
```

- [x] **Step 3.4: 写 src/playground/webgl-hero/page.tsx**

```tsx
import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'

export function PlaygroundPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <CornerMarker />
      <WebGLHero
        title="WebGL Hero Playground"
        subtitle="Primitive · Tier 4"
        primaryColor="#ff006e"
        bgColor="#000000"
      />
    </div>
  )
}
```

- [x] **Step 3.5: 跑 build 确认 playground entry 被发现**

Run:
```bash
bun run build
```

Expected: `[vite] discovered entries: home, playground_webgl-hero`，`dist/src/playground/webgl-hero/index.html` 存在。

- [x] **Step 3.6: 更新测试里的路径并运行**

编辑 `tests/webgl-hero.spec.ts`，把 4 个 `page.goto('/playground/webgl-hero/')` 改为 `page.goto('/src/playground/webgl-hero/')`。

然后：
```bash
bun x playwright test tests/webgl-hero.spec.ts --project=desktop
```

Expected: 4 个 test PASS。

- [x] **Step 3.7: 跑全部断点**

```bash
bun x playwright test tests/webgl-hero.spec.ts
```

Expected: 12 test (4 × 3 project) 全 PASS。

- [x] **Step 3.8: 提交**

```bash
git add src/playground/ vite.config.ts tests/webgl-hero.spec.ts
git commit -m "feat(playground): add WebGLHero playground page, all tests pass"
```

---

## Task 4: self-review.ts 脚本（机械检查）

**目的**：一个可被 `/publish` skill 调用的脚本，对指定页面做机械自审检查，返回结构化结果。

**Files:**
- Create: `scripts/self-review.ts`

- [x] **Step 4.1: 写 self-review.ts**

```ts
#!/usr/bin/env bun
/**
 * self-review.ts · 页面机械自审脚本
 *
 * 用法：
 *   bun run scripts/self-review.ts <page-path>
 *
 * <page-path> 示例：
 *   /                           首页
 *   /src/articles/hello-world/  文章页
 *
 * 输出：JSON 到 stdout
 *   {
 *     "pass": boolean,
 *     "score": number,       // 0-100
 *     "issues": string[],
 *     "breakpoints": {
 *       desktop: { passed: bool, issues: [] },
 *       tablet: ...,
 *       mobile: ...,
 *     }
 *   }
 *
 * 退出码：
 *   0 若 pass=true
 *   1 若 pass=false
 */

import { chromium, type Browser, type Page } from 'playwright'
import { spawn, type ChildProcess } from 'node:child_process'

const BREAKPOINTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

interface BreakpointResult {
  passed: boolean
  issues: string[]
}

interface ReviewResult {
  pass: boolean
  score: number
  issues: string[]
  breakpoints: Record<string, BreakpointResult>
}

async function startPreview(): Promise<ChildProcess> {
  console.error('[self-review] starting preview server...')
  const proc = spawn('bun', ['run', 'preview'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })

  // 等待 preview 就绪
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('preview timeout')), 30_000)
    proc.stdout!.on('data', (data) => {
      if (data.toString().includes('Local:')) {
        clearTimeout(timeout)
        setTimeout(resolve, 500) // 给 preview 一点 buffer
      }
    })
    proc.on('error', reject)
  })

  return proc
}

async function reviewBreakpoint(
  browser: Browser,
  pagePath: string,
  bp: typeof BREAKPOINTS[number]
): Promise<BreakpointResult> {
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
  })
  const page = await context.newPage()

  const issues: string[] = []
  const consoleErrors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  try {
    await page.goto(`http://localhost:4173${pagePath}`, { waitUntil: 'networkidle', timeout: 15_000 })

    // R1.1 · 无横向滚动
    const hasHscroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    )
    if (hasHscroll) issues.push(`[${bp.name}] horizontal scroll detected`)

    // R1.2 · 页面有内容（html body 非空）
    const bodyText = await page.evaluate(() => document.body.innerText.trim())
    if (bodyText.length === 0) issues.push(`[${bp.name}] page body is empty`)

    // R1.3 · 没有 console error
    if (consoleErrors.length > 0) {
      issues.push(`[${bp.name}] console errors: ${consoleErrors.slice(0, 3).join(' | ')}`)
    }

    // R1.4 · 首屏内容高度 >= 视口高度的 50%（避免「页面几乎空白」）
    const firstScreenContentHeight = await page.evaluate(() => {
      const body = document.body
      return body.getBoundingClientRect().height
    })
    if (firstScreenContentHeight < bp.height * 0.5) {
      issues.push(`[${bp.name}] first screen content suspiciously small (${firstScreenContentHeight}px)`)
    }
  } catch (err) {
    issues.push(`[${bp.name}] navigation failed: ${(err as Error).message}`)
  } finally {
    await context.close()
  }

  return { passed: issues.length === 0, issues }
}

async function main() {
  const pagePath = process.argv[2] || '/'
  console.error(`[self-review] reviewing ${pagePath}`)

  const previewProc = await startPreview()

  const browser = await chromium.launch({ headless: true })
  const result: ReviewResult = {
    pass: true,
    score: 100,
    issues: [],
    breakpoints: {
      desktop: { passed: false, issues: [] },
      tablet: { passed: false, issues: [] },
      mobile: { passed: false, issues: [] },
    },
  }

  try {
    for (const bp of BREAKPOINTS) {
      const bpResult = await reviewBreakpoint(browser, pagePath, bp)
      result.breakpoints[bp.name] = bpResult
      if (!bpResult.passed) {
        result.pass = false
        result.issues.push(...bpResult.issues)
      }
    }
    result.score = result.pass ? 100 : Math.max(0, 100 - result.issues.length * 15)
  } finally {
    await browser.close()
    previewProc.kill('SIGINT')
  }

  console.log(JSON.stringify(result, null, 2))
  process.exit(result.pass ? 0 : 1)
}

main().catch((err) => {
  console.error('[self-review] fatal:', err)
  process.exit(2)
})
```

- [x] **Step 4.2: 本地测首页**

Run:
```bash
bun run build && bun run scripts/self-review.ts /
```

Expected: 打印一个 JSON，`pass: true`，退出码 0。

- [x] **Step 4.3: 提交**

```bash
git add scripts/self-review.ts
git commit -m "feat(publish): add self-review.ts with 3-breakpoint mechanical checks"
```

---

## Task 5: `/publish` SKILL.md

**目的**：创建 Claude Code skill 定义文件，说明 `/publish` 的调用方式和执行步骤。

**Files:**
- Create: `skills/publish/SKILL.md`

- [x] **Step 5.1: 写 SKILL.md**

```markdown
---
name: publish
description: Publish an article to weid.fun. Takes raw materials (markdown + optional directives + optional attachments), organizes them into articles/<slug>/source/, generates a Tier 4 page, updates the home page, and runs a self-review loop. Use when user says "publish this article" or invokes /publish.
---

# /publish · Publish an article to weid.fun

You are executing the publish pipeline for weid.fun. Follow the steps **in order**, do NOT skip, do NOT interact with the user mid-flow.

## Input Parsing

The user invokes you as:

```
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

**从脚本 stdout 读取 slug**——脚本会打印 `SLUG=<value>`。

### Step 2 · 提取色彩

```bash
bun run scripts/publish/extract-palette.ts <slug>
```

这个脚本会从 `articles/<slug>/source/attachments/` 的第一张图提取主色，写回 `meta.json.colors`。如果没有图片，使用默认色（`#8338ec`）。

### Step 3 · 生成 page.tsx

Read `articles/<slug>/source/raw.md` 和 `articles/<slug>/meta.json`。然后**你亲自**写 `articles/<slug>/page.tsx`。

**必须遵守的模板**（MVP，每篇文章结构相同）：

\`\`\`tsx
import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'
import ReactMarkdown from 'react-markdown'
import meta from './meta.json'

const articleContent = `<这里粘贴 raw.md 的完整内容>`

export function ArticlePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title={meta.title}
        subtitle={meta.series || undefined}
        primaryColor={meta.colors.primary}
        bgColor={meta.colors.bg}
      />
      <article className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-lg">
        <ReactMarkdown>{articleContent}</ReactMarkdown>
      </article>
    </div>
  )
}
\`\`\`

**重要**：
- 把 `raw.md` 的全部内容**字符串化**（处理反引号、换行），填入 `articleContent`
- 不要修改 meta.json 的内容
- 只使用 CornerMarker 和 WebGLHero 两个 primitive（Plan C 会扩展）

### Step 4 · 写 index.html 和 main.tsx

**`articles/<slug>/index.html`**:
\`\`\`html
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
\`\`\`

把 `<meta.title>` 替换为实际标题。

**`articles/<slug>/main.tsx`**:
\`\`\`tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArticlePage } from './page'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArticlePage />
  </React.StrictMode>
)
\`\`\`

### Step 5 · 更新 home-data.json

```bash
bun run scripts/publish/update-home-data.ts <slug>
```

这会把 meta.json 的内容追加到 `src/home/home-data.json.articles[]`。

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
```
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
```

- [x] **Step 5.2: 提交**

```bash
git add skills/publish/SKILL.md
git commit -m "feat(publish): add /publish SKILL.md orchestration doc"
```

---

## Task 6: `scripts/publish/organize-source.ts`

**目的**：把 `inbox/<name>/` 的内容复制到 `articles/<slug>/source/`，并生成初始的 `meta.json`。

**Files:**
- Create: `scripts/publish/organize-source.ts`

- [x] **Step 6.1: 写 organize-source.ts**

```ts
#!/usr/bin/env bun
/**
 * organize-source.ts · 把 inbox/<name>/ 复制到 articles/<slug>/source/
 *
 * Usage:
 *   bun run scripts/publish/organize-source.ts <inbox-path> [--slug <s>] [--series <s>] [--pin]
 *
 * 产物：
 *   articles/<slug>/source/       ← 原始材料
 *   articles/<slug>/meta.json     ← 初版元数据
 *
 * 输出：stdout 一行 SLUG=<value>
 */

import fs from 'node:fs'
import path from 'node:path'

interface Args {
  inboxPath: string
  slug?: string
  series?: string
  pin: boolean
}

function parseArgs(argv: string[]): Args {
  if (argv.length === 0) {
    console.error('Usage: organize-source.ts <inbox-path> [--slug <s>] [--series <s>] [--pin]')
    process.exit(1)
  }

  const args: Args = { inboxPath: argv[0], pin: false }
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug') args.slug = argv[++i]
    else if (a === '--series') args.series = argv[++i]
    else if (a === '--pin') args.pin = true
  }
  return args
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled'
}

function extractTitle(rawMd: string): string {
  const h1 = rawMd.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  const firstLine = rawMd.split('\n').find((l) => l.trim())?.trim() || 'Untitled'
  return firstLine.slice(0, 100)
}

function copyRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name)
    const d = path.join(dest, item.name)
    if (item.isDirectory()) {
      copyRecursive(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(args.inboxPath)) {
    console.error(`Error: ${args.inboxPath} does not exist`)
    process.exit(1)
  }

  const rawMdPath = path.join(args.inboxPath, 'raw.md')
  if (!fs.existsSync(rawMdPath)) {
    console.error(`Error: ${rawMdPath} does not exist. inbox/<name>/ must contain raw.md`)
    process.exit(1)
  }
  const rawMd = fs.readFileSync(rawMdPath, 'utf-8')
  const title = extractTitle(rawMd)
  const slug = args.slug || slugify(title)

  const articleDir = path.join('src', 'articles', slug)
  if (fs.existsSync(articleDir)) {
    console.error(`Error: ${articleDir} already exists. Delete it first to regenerate.`)
    process.exit(1)
  }

  const sourceDir = path.join(articleDir, 'source')
  copyRecursive(args.inboxPath, sourceDir)

  const meta = {
    slug,
    title,
    series: args.series || undefined,
    publishedAt: new Date().toISOString().slice(0, 10),
    pin: args.pin,
    colors: {
      primary: '#8338ec',
      bg: '#000000',
    },
    excerpt: rawMd
      .replace(/^#.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160),
  }
  fs.writeFileSync(path.join(articleDir, 'meta.json'), JSON.stringify(meta, null, 2))

  console.error(`✓ organized: ${articleDir}`)
  console.log(`SLUG=${slug}`)
}

main().catch((err) => {
  console.error('[organize-source] fatal:', err)
  process.exit(1)
})
```

- [x] **Step 6.2: 提交**

```bash
git add scripts/publish/organize-source.ts
git commit -m "feat(publish): add organize-source.ts"
```

---

## Task 7: `scripts/publish/extract-palette.ts`

**目的**：从 source 的第一张图提取主色写入 meta.json。

**Files:**
- Create: `scripts/publish/extract-palette.ts`

- [ ] **Step 7.1: 安装依赖 color-thief**

Run:
```bash
bun add -d sharp
```

> **说明**：用 `sharp` 读图 + 手动求平均色。color-thief 的 Node 版本依赖 canvas，编译麻烦，用 sharp 更可靠。

- [ ] **Step 7.2: 写 extract-palette.ts**

```ts
#!/usr/bin/env bun
/**
 * extract-palette.ts · 从 articles/<slug>/source/attachments 的第一张图提取主色
 *
 * Usage:
 *   bun run scripts/publish/extract-palette.ts <slug>
 *
 * 写入：articles/<slug>/meta.json 的 colors.primary 字段
 */

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

function rgbToHex(r: number, g: number, b: number): string {
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function findFirstImage(dir: string): string | null {
  if (!fs.existsSync(dir)) return null
  const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const item of items) {
    const full = path.join(dir, item.name)
    if (item.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(item.name)) return full
    if (item.isDirectory()) {
      const nested = findFirstImage(full)
      if (nested) return nested
    }
  }
  return null
}

async function extractDominantColor(imgPath: string): Promise<string> {
  const { data, info } = await sharp(imgPath)
    .resize(50, 50, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  // 求 RGB 平均值（跳过几乎纯黑和纯白的像素）
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += info.channels) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2]
    const brightness = (pr + pg + pb) / 3
    if (brightness < 20 || brightness > 235) continue
    r += pr
    g += pg
    b += pb
    n++
  }

  if (n === 0) return '#8338ec' // fallback
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n))
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: extract-palette.ts <slug>')
    process.exit(1)
  }

  const articleDir = path.join('src', 'articles', slug)
  const metaPath = path.join(articleDir, 'meta.json')
  if (!fs.existsSync(metaPath)) {
    console.error(`Error: ${metaPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const imgPath = findFirstImage(path.join(articleDir, 'source', 'attachments'))

  if (!imgPath) {
    console.error('[extract-palette] no image found, using default color')
    meta.colors.primary = '#8338ec'
  } else {
    console.error(`[extract-palette] extracting from ${imgPath}`)
    meta.colors.primary = await extractDominantColor(imgPath)
  }

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
  console.error(`✓ palette: ${meta.colors.primary}`)
}

main().catch((err) => {
  console.error('[extract-palette] fatal:', err)
  process.exit(1)
})
```

- [ ] **Step 7.3: 提交**

```bash
git add scripts/publish/extract-palette.ts package.json bun.lock
git commit -m "feat(publish): add extract-palette.ts using sharp"
```

---

## Task 8: `scripts/publish/update-home-data.ts`

**目的**：把新文章的 meta.json 追加到 `src/home/home-data.json.articles[]`。

**Files:**
- Create: `scripts/publish/update-home-data.ts`

- [ ] **Step 8.1: 写 update-home-data.ts**

```ts
#!/usr/bin/env bun
/**
 * update-home-data.ts · 把新文章追加到 src/home/home-data.json
 *
 * Usage:
 *   bun run scripts/publish/update-home-data.ts <slug>
 *
 * 行为：
 * - 读 articles/<slug>/meta.json
 * - 读 src/home/home-data.json
 * - 如果 articles[] 里已有同 slug，替换；否则追加
 * - 写回
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: update-home-data.ts <slug>')
    process.exit(1)
  }

  const articleMetaPath = path.join('src', 'articles', slug, 'meta.json')
  const homeDataPath = path.join('src', 'home', 'home-data.json')

  if (!fs.existsSync(articleMetaPath)) {
    console.error(`Error: ${articleMetaPath} not found`)
    process.exit(1)
  }
  if (!fs.existsSync(homeDataPath)) {
    console.error(`Error: ${homeDataPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(articleMetaPath, 'utf-8'))
  const homeData = JSON.parse(fs.readFileSync(homeDataPath, 'utf-8'))

  const existingIdx = homeData.articles.findIndex((a: { slug: string }) => a.slug === slug)
  if (existingIdx >= 0) {
    homeData.articles[existingIdx] = meta
    console.error(`✓ replaced: ${slug}`)
  } else {
    homeData.articles.push(meta)
    console.error(`✓ appended: ${slug}`)
  }

  homeData.portal.lastUpdated = new Date().toISOString().slice(0, 10)

  fs.writeFileSync(homeDataPath, JSON.stringify(homeData, null, 2))
}

main()
```

- [ ] **Step 8.2: 提交**

```bash
git add scripts/publish/update-home-data.ts
git commit -m "feat(publish): add update-home-data.ts"
```

---

## Task 9: 创建 src/articles/ 目录 + 更新 vite.config.ts 路径

**目的**：迁移「文章放在哪里」——Plan A 的 vite.config.ts 扫的是 `src/articles`，和 organize-source.ts 一致。这里创建空的 src/articles 目录。

**Files:**
- Create: `src/articles/.gitkeep`

- [ ] **Step 9.1: 创建目录**

```bash
mkdir -p src/articles
touch src/articles/.gitkeep
```

- [ ] **Step 9.2: 提交**

```bash
git add src/articles/.gitkeep
git commit -m "chore: scaffold src/articles directory"
```

---

## Task 10: 发布一篇测试文章 end-to-end

**目的**：通过实际发布一篇文章验证整个 pipeline。

**Files:**
- Create: `inbox/hello-world/raw.md`
- Create: `inbox/hello-world/attachments/.gitkeep`
- Generate: `src/articles/hello-world/**`

> 注意：`inbox/` 在 .gitignore 里，不会被提交。测试材料只在本地存在。

- [ ] **Step 10.1: 创建测试 inbox 材料**

```bash
mkdir -p inbox/hello-world/attachments
```

创建 `inbox/hello-world/raw.md`：

```markdown
# Hello, weid.fun

This is the first test article published through `/publish`. If you're reading this,
the publish pipeline worked end-to-end: content was organized, a color was picked,
a page was generated, the home data was updated, the build succeeded, and self-review
passed on all three breakpoints.

## What this proves

- `/publish inbox/hello-world` creates `src/articles/hello-world/`
- The article uses WebGLHero as its Tier 4 hero
- The site chrome (CornerMarker) appears on all pages
- Self-review catches obvious problems

## What's next

Plan C will upgrade:
- Claude Vision review (not just mechanical checks)
- More primitives in the Component Vault
- Series mechanism
- Personal branch setup
```

- [ ] **Step 10.2: 运行 /publish pipeline (手动)**

因为 `/publish` 是 Claude Code skill，不能直接 bash。但我们可以**手动模拟** skill 的步骤：

**Step 10.2.a: 组织 source**

```bash
bun run scripts/publish/organize-source.ts inbox/hello-world
```

Expected: 打印 `SLUG=hello-weid-fun`（或类似），生成 `src/articles/hello-weid-fun/`。

记下 slug。

**Step 10.2.b: 提取 palette**

```bash
bun run scripts/publish/extract-palette.ts hello-weid-fun
```

Expected: 打印 `palette: #8338ec`（因为没有图片，用 fallback）。

**Step 10.2.c: 手写 page.tsx** （按 SKILL.md Step 3 的模板）

创建 `src/articles/hello-weid-fun/page.tsx`：

```tsx
import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'
import ReactMarkdown from 'react-markdown'
import meta from './meta.json'

const articleContent = `# Hello, weid.fun

This is the first test article published through \`/publish\`. If you're reading this,
the publish pipeline worked end-to-end: content was organized, a color was picked,
a page was generated, the home data was updated, the build succeeded, and self-review
passed on all three breakpoints.

## What this proves

- \`/publish inbox/hello-world\` creates \`src/articles/hello-world/\`
- The article uses WebGLHero as its Tier 4 hero
- The site chrome (CornerMarker) appears on all pages
- Self-review catches obvious problems

## What's next

Plan C will upgrade:
- Claude Vision review (not just mechanical checks)
- More primitives in the Component Vault
- Series mechanism
- Personal branch setup
`

export function ArticlePage() {
  return (
    <div data-testid="article-root" className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title={meta.title}
        subtitle={meta.series || undefined}
        primaryColor={meta.colors.primary}
        bgColor={meta.colors.bg}
      />
      <article className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-lg">
        <ReactMarkdown>{articleContent}</ReactMarkdown>
      </article>
    </div>
  )
}
```

**Step 10.2.d: 写 index.html + main.tsx**

`src/articles/hello-weid-fun/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Hello, weid.fun · weid.fun</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`src/articles/hello-weid-fun/main.tsx`:
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

**Step 10.2.e: 安装 prose tailwind plugin**

`@tailwindcss/typography` 提供 `prose` 类。安装：

```bash
bun add -d @tailwindcss/typography
```

修改 `tailwind.config.ts` 的 plugins：

```ts
import typography from '@tailwindcss/typography'

const config: Config = {
  // ... 其它不变
  plugins: [typography],
}
```

**Step 10.2.f: 更新 home-data**

```bash
bun run scripts/publish/update-home-data.ts hello-weid-fun
```

Expected: 打印 `✓ appended: hello-weid-fun`。

**Step 10.2.g: 构建**

```bash
bun run build
```

Expected: `[vite] discovered entries: home, articles_hello-weid-fun, playground_webgl-hero`，构建成功。

**Step 10.2.h: 自审**

```bash
bun run scripts/self-review.ts /src/articles/hello-weid-fun/
```

Expected: `pass: true`，退出码 0。

- [ ] **Step 10.3: 本地 preview 手动验证**

```bash
bun run preview
```

访问：
- `http://localhost:4173/` → 首页应该出现 Hello weid.fun 的橱窗卡片
- `http://localhost:4173/src/articles/hello-weid-fun/` → 文章页，WebGL hero + markdown 正文

Ctrl+C 停掉。

- [ ] **Step 10.4: 提交（注意：文章文件不属于 personal content 的 ignore 路径吗？）**

回忆 Plan A 的 `.gitignore`：`/src/articles/` 是 ignore 的，`/articles/` 也是 ignore 的。所以 `hello-weid-fun` 是**本地文件**，不会进 main 分支的 commit。

这是正确的——Plan B 只是验证 pipeline，不是真的要把 hello-world 作为示例文章放进框架。

但是 `home-data.json` 被修改了（添加了一条）。这个文件也在 .gitignore 里，所以也不会被 commit。

所以此 Task **没有新文件进 git**。但是我们需要把脚本改动、tailwind.config 修改、@tailwindcss/typography 依赖 commit 掉：

```bash
git add package.json bun.lock tailwind.config.ts
git commit -m "chore(deps): add @tailwindcss/typography for article prose"
```

---

## Task 11: 回滚 hello-weid-fun 测试数据 + 最终验证

**目的**：把测试数据清理干净，让 framework 分支回到 pristine 状态。

- [ ] **Step 11.1: 删除本地测试文章**

```bash
rm -rf src/articles/hello-weid-fun
```

- [ ] **Step 11.2: 还原 home-data.json**

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

- [ ] **Step 11.3: 重新 build 确认干净**

```bash
bun run build
```

Expected: 只发现 home + playground_webgl-hero 两个 entry。

- [ ] **Step 11.4: 跑完整 test 套件**

```bash
bun run test:e2e
```

Expected: 所有之前的 test 仍然 PASS。

- [ ] **Step 11.5: git status 确认干净**

```bash
git status
```

Expected: `working tree clean`。

---

## Task 12: 打 tag `plan-b-complete`

- [ ] **Step 12.1: 打 tag**

```bash
git tag -a plan-b-complete -m "Plan B complete: /publish skill MVP + WebGLHero + self-review mechanical"
```

- [ ] **Step 12.2: 报告**

```
✅ Plan B 完成。

已交付：
- WebGLHero primitive (r3f + shader + mobile DPR 限制)
- Playground 页面用于 primitive 开发
- self-review.ts (三断点机械检查)
- /publish SKILL.md orchestration
- scripts/publish/{organize-source, extract-palette, update-home-data}.ts
- 验证：手动模拟 /publish 全流程通过

下一步（Plan C）：
- 扩展 primitives (ScrollReveal / DragFigure / AudioPad)
- Claude Vision 自审接入
- 系列机制 (spec.json)
- 对话模式支持
- baoyu-article-illustrator 集成
- personal 分支建立
```

---

## 附录 · Plan B 未覆盖

| 功能 | 在哪里 | 原因 |
|---|---|---|
| 对话模式 `/publish` 无 path | Plan C | 需要从 Claude Code 上下文抓取附件，更复杂 |
| Claude Vision 视觉评审 | Plan C | 需要 Anthropic SDK 集成 |
| 系列 spec.json 读写 | Plan C | 要有多篇文章才能真正测试 |
| `--no-illustrate` flag | Plan C | 需要 baoyu-article-illustrator 集成 |
| personal 分支 | Plan C | 需要先有真实个人文章 |
| 命令面板 ⌘K | 未来 Plan | 非 MVP |
| Archive 页 | 未来 Plan | 当前橱窗直接全列 |

## 附录 · /publish 的模拟执行 vs 真正由 Claude 执行

Task 10 手动模拟了 pipeline，这是为了测试脚本的正确性。真正使用时，用户在 Claude Code 里输入 `/publish inbox/hello-world`，Claude 读取 `skills/publish/SKILL.md`，按照其中的步骤调用脚本并写 page.tsx。

**手动模拟和真实执行的差异**：
- 手动模拟里 page.tsx 是你手写的（按 SKILL.md 的模板）
- 真实执行里 page.tsx 是 Claude 写的（也按同一个模板，但由 LLM 执行字符串化和模板填充）

功能上应该完全等价。
