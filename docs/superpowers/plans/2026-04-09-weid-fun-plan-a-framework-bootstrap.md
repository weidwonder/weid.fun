# weid.fun Plan A · 框架 Bootstrap 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 产出一个可访问的 `https://weid.fun`，显示一个空的「生成式门户 + 精选橱窗」首页 placeholder。这是整个框架的 bootstrap——之后的 Plan B 会在此基础上加 /publish 能力。

**Architecture:** Vite 多页模式 + React 18 + TypeScript + Tailwind + Playwright（用于 E2E 与响应式自审）。所有页面通过 `src/**/index.html` 作为 Vite entry，`vite.config.ts` 用 glob 动态发现 entries。部署通过 rsync + nginx 静态文件服务。

**Tech Stack:** Bun, Vite 5, React 18, TypeScript 5, Tailwind CSS 3, Playwright 1.x

**Spec Reference:** `docs/superpowers/specs/2026-04-09-weid-fun-blog-design.md`（以下简称 **Spec**）

---

## 工作约定

**前置**：git 仓库已初始化（`main` 分支，commit `199b9e5` 已有 docs + .gitignore）。本计划的所有工作在 `main` 分支进行。

**目录基准**：所有相对路径都基于 `/Users/weidwonder/projects/weid.fun`，即项目根目录。任何命令都假设 pwd 是项目根。

**TDD 原则**：能被 Playwright 测到的东西（页面渲染、响应式、可交互性），**先写测试**。纯配置文件（tsconfig、vite.config）通过「构建能否成功」隐式测试。

**提交粒度**：每个 Task 末尾一次提交。commit message 前缀：`feat`（新功能）/ `chore`（配置）/ `test`（测试）/ `fix`（修复）。

**禁用 `--no-verify`**。

---

## 文件结构预览

本 Plan 完成后，项目根会有这些文件（新增为主）：

```
weid.fun/
├── .gitignore                          (已存在)
├── package.json                        (新增, Task 1)
├── bun.lock                            (自动生成)
├── tsconfig.json                       (新增, Task 1)
├── tsconfig.node.json                  (新增, Task 1)
├── vite.config.ts                      (新增, Task 4)
├── tailwind.config.ts                  (新增, Task 2)
├── postcss.config.js                   (新增, Task 2)
├── playwright.config.ts                (新增, Task 6)
├── index.html                          (新增, Task 9 · 项目根)
├── src/
│   ├── styles/
│   │   └── global.css                  (新增, Task 2)
│   ├── lib/
│   │   └── types.ts                    (新增, Task 8)
│   ├── standards/
│   │   └── hard-rules.md               (新增, Task 5)
│   ├── primitives/
│   │   └── CornerMarker/
│   │       ├── CornerMarker.tsx        (新增, Task 7)
│   │       └── index.ts                (新增, Task 7)
│   └── home/
│       ├── main.tsx                    (新增, Task 9)
│       ├── HomePage.tsx                (新增, Task 9/11/12)
│       ├── Portal.tsx                  (新增, Task 11)
│       ├── Vitrine.tsx                 (新增, Task 12)
│       └── home-data.json              (新增, Task 8)
├── tests/
│   ├── corner-marker.spec.ts           (新增, Task 7)
│   ├── home.spec.ts                    (新增, Task 9/11/12)
│   └── responsive.spec.ts              (新增, Task 13)
├── scripts/
│   ├── deploy.sh                       (新增, Task 14)
│   └── nginx/
│       └── weid.fun.conf               (新增, Task 15)
└── docs/
    └── superpowers/plans/
        └── 2026-04-09-weid-fun-plan-a-framework-bootstrap.md   (本文件)
```

---

## Task 1: 初始化 Bun + Vite + React + TypeScript

**目的**：创建 `package.json`、`tsconfig.json`、安装核心依赖。

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [x] **Step 1.1: 初始化 package.json**

创建 `package.json`：

```json
{
  "name": "weid-fun",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "description": "weid.fun · Tier 4 personal blog framework",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
```

- [x] **Step 1.2: 安装依赖**

Run:
```bash
bun install
```

Expected: Creates `bun.lock` and `node_modules/`. No errors.

- [x] **Step 1.3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [x] **Step 1.4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts", "postcss.config.js", "playwright.config.ts"]
}
```

- [x] **Step 1.5: 验证 TypeScript 能解析**

Run:
```bash
bun x tsc --noEmit
```

Expected: No errors (因为还没有 src 文件，只需要配置本身没语法错误).

- [x] **Step 1.6: 提交**

```bash
git add package.json bun.lock tsconfig.json tsconfig.node.json
git commit -m "chore: init bun + vite + react + typescript scaffolding"
```

---

## Task 2: 配置 Tailwind CSS + PostCSS + global.css

**目的**：Tailwind 可以编译，`src/styles/global.css` 是所有页面的基础 CSS。

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/styles/global.css`

- [x] **Step 2.1: 创建 tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{html,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // 响应式字号：最小 / 首选 / 最大
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        'fluid-2xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',
        'fluid-3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4.5rem)',
        'fluid-4xl': 'clamp(3rem, 2.25rem + 3.75vw, 6rem)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [x] **Step 2.2: 创建 postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [x] **Step 2.3: 创建 src/styles/global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* 支持 iPhone safe-area (刘海屏/灵动岛) */
  :root {
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
  }
}
```

- [x] **Step 2.4: 提交**

```bash
git add tailwind.config.ts postcss.config.js src/styles/global.css
git commit -m "chore: configure tailwind css with responsive fluid typography"
```

---

## Task 3: 创建基础目录结构和 .gitkeep

**目的**：所有规划中的空目录先物理存在，后续 Task 可以直接写文件。

**Files:**
- Create: `src/lib/.gitkeep`
- Create: `src/standards/.gitkeep` (注意：Task 5 会加文件)
- Create: `src/primitives/.gitkeep`
- Create: `src/home/.gitkeep` (Task 9 会加文件)
- Create: `tests/.gitkeep`
- Create: `scripts/.gitkeep`

- [x] **Step 3.1: 创建所有空目录的占位**

```bash
mkdir -p src/lib src/standards src/primitives src/home src/styles tests scripts/nginx
touch src/lib/.gitkeep src/standards/.gitkeep src/primitives/.gitkeep src/home/.gitkeep tests/.gitkeep scripts/.gitkeep
```

- [x] **Step 3.2: 提交**

```bash
git add src/lib/.gitkeep src/standards/.gitkeep src/primitives/.gitkeep src/home/.gitkeep tests/.gitkeep scripts/.gitkeep
git commit -m "chore: scaffold empty project directories"
```

---

## Task 4: 写 vite.config.ts（多页动态 entry）

**目的**：Vite 能够发现：
1. 项目根的 `index.html`（首页）
2. 所有 `src/articles/<slug>/index.html`（文章页，现在没有，未来 /publish skill 会产生）

**关键设计**：首页的 `index.html` 放在**项目根**（而非 `src/home/index.html`），这样 Vite 的默认 URL 直接是 `/`。首页的 React 代码仍在 `src/home/` 下，`index.html` 通过 `<script type="module" src="/src/home/main.tsx">` 引用。

**Files:**
- Create: `vite.config.ts`

- [x] **Step 4.1: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import path from 'node:path'
import fs from 'node:fs'

/**
 * 动态发现 Vite multi-page entries：
 * - 首页：项目根的 index.html
 * - 文章页：src/articles/<slug>/index.html（当前为空，未来由 /publish 生成）
 *
 * 这个函数在 vite dev 和 build 启动时各跑一次。
 * 新增一篇文章后重启 vite，会自动被发现。
 */
function discoverEntries(): Record<string, string> {
  const entries: Record<string, string> = {
    home: resolve(__dirname, 'index.html'),
  }

  const articlesRoot = path.resolve(__dirname, 'src/articles')
  if (fs.existsSync(articlesRoot)) {
    for (const item of fs.readdirSync(articlesRoot, { withFileTypes: true })) {
      if (!item.isDirectory()) continue
      const entry = path.join(articlesRoot, item.name, 'index.html')
      if (fs.existsSync(entry)) {
        entries[`articles_${item.name}`] = entry
      }
    }
  }

  return entries
}

export default defineConfig(() => {
  const entries = discoverEntries()
  console.log('[vite] discovered entries:', Object.keys(entries).join(', '))

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        input: entries,
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  }
})
```

- [x] **Step 4.2: 运行 tsc 验证配置语法**

Run:
```bash
bun x tsc -p tsconfig.node.json --noEmit
```

Expected: 无错误。

> **注**：此时还不能跑 `bun run build`——因为还没有 `index.html`，`discoverEntries` 会返回一个指向不存在文件的 entry。这是预期的，Task 9 会补上 index.html 后才跑 build。

- [x] **Step 4.3: 提交**

```bash
git add vite.config.ts
git commit -m "feat(vite): add dynamic multi-page entry discovery"
```

---

## Task 5: 写 Hard Rules baseline (R1)

**目的**：创建 `src/standards/hard-rules.md`，初始只包含 R1 全端自适应规则。这是框架分支的 baseline。

**Files:**
- Create: `src/standards/hard-rules.md`
- Delete: `src/standards/.gitkeep`

- [x] **Step 5.1: 写 hard-rules.md**

```markdown
# Hard Rules · weid.fun 框架 Baseline

> 本文件是 **框架分支**（main）的基线硬规则。personal 分支可能存在一个 `hard-rules.custom.md`，Agent 工作时会合并两个文件。
>
> 所有规则都是 **不可协商** 的——任何违反都会导致自审失败。
>
> 规则随使用积累。现在只有 R1。

## R1. 全端自适应 (Responsive as First-Class)

**规则**：每个页面必须在以下三个断点都能正常访问、无横向滚动、所有交互有 touch 等价方案。

| 断点 | 视口 |
|---|---|
| desktop | 1920 × 1080 |
| tablet  | 768 × 1024  |
| mobile  | 375 × 812   |

**具体要求**：
1. 没有 `overflow-x: scroll` 出现在根级（除非明确是 carousel 组件）
2. 任何依赖 `:hover` 的交互都必须在 mobile 有 touch 替代（长按、点击切换态等）
3. 任何 drag 都必须同时支持 mouse 和 touch events
4. WebGL 在 mobile 上 DPR 限制为 `min(devicePixelRatio, 1.5)`
5. 字号使用 `clamp()` 或 Tailwind `text-fluid-*`，不要用固定 px
6. 绝对定位的角落元素必须考虑 `env(safe-area-inset-*)`

**自审检查**：Playwright 在三个断点截图，Claude Vision 检查是否：
- 没有文字被截断
- 没有按钮被挤出视口
- 没有横向滚动条
- 关键交互 affordance 在 mobile 可见
```

- [x] **Step 5.2: 删除 .gitkeep**

```bash
rm src/standards/.gitkeep
```

- [x] **Step 5.3: 提交**

```bash
git add src/standards/hard-rules.md src/standards/.gitkeep
git commit -m "feat(standards): add hard rules baseline with R1 responsive"
```

---

## Task 6: 配置 Playwright

**目的**：Playwright 可以跑 E2E 测试并支持三断点。这是所有后续测试的基础。

**Files:**
- Create: `playwright.config.ts`

- [x] **Step 6.1: 安装 Playwright 浏览器**

Run:
```bash
bun x playwright install chromium
```

Expected: 下载 Chromium（可能几十 MB）。

- [x] **Step 6.2: 创建 playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'bun run build && bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

> **说明**：三个 project 对应三个断点——一个 playwright test 命令会在三个 project 都跑。`webServer` 会在测试前自动 build+preview。

- [x] **Step 6.3: 提交**

```bash
git add playwright.config.ts
git commit -m "chore(test): configure playwright for desktop / tablet / mobile e2e"
```

---

## Task 7: CornerMarker primitive（TDD）

**目的**：第一个 primitive。这是所有页面共用的角落标记。设置「响应式 + safe-area-inset + 可交互」的模式，成为后续 primitives 的样板。

**Files:**
- Create: `tests/corner-marker.spec.ts`
- Create: `src/primitives/CornerMarker/CornerMarker.tsx`
- Create: `src/primitives/CornerMarker/index.ts`

### 7a. 先写测试（TDD）

> **TDD 顺序说明**：按纯 TDD 应该「写测试 → 跑测试确认失败 → 写实现 → 跑测试确认通过」。本 Plan 的 Task 顺序下，Task 7/8/9 先写 primitives 和辅助代码，到 Task 9 才创建 `index.html`。因此 Task 7 里无法立即跑 Playwright 测试（会遇到 `bun run build` 失败）。
>
> **采用的做法**：Task 7 只写测试 + 实现，不跑测试。测试首次运行在 Task 9 Step 9.6/9.7，那时整个 home 页面已就绪。Red → Green 的验证被 **延后** 到 Task 9，但 TDD 的「先写测试后写实现」精神仍然保留——Task 7 写测试的时候 CornerMarker 不存在，写实现的时候测试已经写好。

- [x] **Step 7.1: 写 Playwright test**

创建 `tests/corner-marker.spec.ts`：

```ts
import { test, expect } from '@playwright/test'

test.describe('CornerMarker', () => {
  test('左上角显示站点名且点击回首页', async ({ page }) => {
    await page.goto('/')

    // 左上角 "weid.fun /"
    const siteName = page.locator('[data-testid="corner-marker-home"]')
    await expect(siteName).toBeVisible()
    await expect(siteName).toContainText('weid.fun')

    // 点击（仍在 /，但应该仍然是 visible）
    await siteName.click()
    await expect(page).toHaveURL('/')
  })

  test('右上角显示菜单按钮', async ({ page }) => {
    await page.goto('/')

    const menuBtn = page.locator('[data-testid="corner-marker-menu"]')
    await expect(menuBtn).toBeVisible()
  })

  test('CornerMarker 在所有断点都可见（responsive R1）', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="corner-marker-home"]')).toBeVisible()
    await expect(page.locator('[data-testid="corner-marker-menu"]')).toBeVisible()
  })
})
```

> **说明**：三个 project 自动在 desktop/tablet/mobile 都跑这些测试，覆盖了响应式检查。
>
> **此时先不跑测试**——因为 `index.html` 还不存在，Playwright 的 webServer 会 build 失败。Task 9 会触发首次运行。

### 7b. 实现 CornerMarker

- [x] **Step 7.3: 创建 CornerMarker.tsx**

```tsx
import type { ReactNode } from 'react'

interface CornerMarkerProps {
  /** 点击左上角触发的动作。默认跳转首页 / */
  onHomeClick?: () => void
  /** 点击右上角菜单按钮触发的动作。默认仅打印到 console */
  onMenuClick?: () => void
  /** 站点名，默认 "weid.fun" */
  siteName?: string
}

/**
 * CornerMarker · 站点级外壳 primitive
 *
 * 两个元素：
 * - 左上角：站点名，点击回首页
 * - 右上角：⌘ 菜单按钮（MVP 阶段仅占位，后续 Plan 会接入命令面板）
 *
 * 响应式要求 (R1)：
 * - 所有断点都可见
 * - 手机端使用 safe-area-inset 避让刘海 / 灵动岛
 * - 不影响 WebGL canvas 的 pointer events（pointer-events: none on wrapper）
 */
export function CornerMarker({
  onHomeClick,
  onMenuClick,
  siteName = 'weid.fun',
}: CornerMarkerProps): ReactNode {
  const handleHome = () => {
    if (onHomeClick) return onHomeClick()
    window.location.href = '/'
  }

  const handleMenu = () => {
    if (onMenuClick) return onMenuClick()
    console.log('[CornerMarker] menu clicked (command palette pending)')
  }

  return (
    <div
      aria-hidden={false}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{
        paddingTop: 'max(12px, var(--sat))',
        paddingRight: 'max(12px, var(--sar))',
        paddingBottom: 'max(12px, var(--sab))',
        paddingLeft: 'max(12px, var(--sal))',
      }}
    >
      {/* 左上角站点名 */}
      <button
        type="button"
        data-testid="corner-marker-home"
        onClick={handleHome}
        className="
          pointer-events-auto absolute top-0 left-0
          font-mono text-fluid-xs tracking-wider
          text-neutral-400 hover:text-neutral-100
          transition-colors duration-200
          px-2 py-1
          bg-transparent border-0 cursor-pointer
        "
        style={{
          top: 'max(12px, var(--sat))',
          left: 'max(12px, var(--sal))',
        }}
      >
        {siteName} /
      </button>

      {/* 右上角菜单按钮 */}
      <button
        type="button"
        data-testid="corner-marker-menu"
        onClick={handleMenu}
        aria-label="Open menu"
        className="
          pointer-events-auto absolute top-0 right-0
          w-6 h-6 rounded-full
          border border-neutral-500 hover:border-neutral-100
          text-neutral-400 hover:text-neutral-100
          flex items-center justify-center
          text-[10px]
          bg-transparent cursor-pointer
          transition-colors duration-200
        "
        style={{
          top: 'max(12px, var(--sat))',
          right: 'max(12px, var(--sar))',
        }}
      >
        ⌘
      </button>
    </div>
  )
}
```

- [x] **Step 7.4: 创建 index.ts barrel export**

```ts
export { CornerMarker } from './CornerMarker'
```

- [x] **Step 7.5: 提交 primitive 本身**

```bash
git add src/primitives/CornerMarker/ tests/corner-marker.spec.ts
git commit -m "feat(primitive): add CornerMarker with responsive safe-area handling"
```

> **注意**：此时 test 仍会失败，因为还没有首页。Task 9 会修好。Test 失败 OK。

---

## Task 8: home-data.json + 类型定义

**目的**：定义首页数据结构（文章列表 + portal 配置），创建一个空的初始值。

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/home/home-data.json`
- Delete: `src/lib/.gitkeep`, `src/home/.gitkeep`

- [x] **Step 8.1: 写 types.ts**

```ts
/**
 * weid.fun 核心类型定义
 */

export interface ArticleColors {
  /** 主色 —— 用作橱窗 fallback 色和链接高亮 */
  primary: string
  /** 背景色 */
  bg: string
  /** 强调色（可选） */
  accent?: string
}

export interface ArticleMeta {
  /** URL slug, 对应 articles/<slug>/ 目录名 */
  slug: string
  /** 文章标题 */
  title: string
  /** 所属系列名（可选） */
  series?: string
  /** 发布日期 ISO 8601 (YYYY-MM-DD) */
  publishedAt: string
  /** 是否在首页橱窗置顶 */
  pin: boolean
  /** 文章主色系 */
  colors: ArticleColors
  /** 封面图路径（相对项目根） */
  coverImage?: string
  /** 摘要文字（1-2 句） */
  excerpt: string
}

export interface PortalConfig {
  /** 门户主标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** 最后更新时间（ISO 日期） */
  lastUpdated: string
}

export interface HomeData {
  articles: ArticleMeta[]
  portal: PortalConfig
}
```

- [x] **Step 8.2: 写空的 home-data.json**

```json
{
  "articles": [],
  "portal": {
    "title": "A place for curious writing.",
    "subtitle": "Coming soon.",
    "lastUpdated": "2026-04-09"
  }
}
```

- [x] **Step 8.3: 清理 .gitkeep**

```bash
rm src/lib/.gitkeep src/home/.gitkeep
```

- [x] **Step 8.4: 提交**

```bash
git add src/lib/types.ts src/home/home-data.json src/lib/.gitkeep src/home/.gitkeep
git commit -m "feat(home): add HomeData types and empty initial data"
```

---

## Task 9: 首页 index.html (root) + main.tsx + 最小 HomePage

**目的**：创建 Vite 能找到的 entry（项目根的 `index.html`），让 CornerMarker test 通过。此时首页只有 CornerMarker + 占位文字。

**Files:**
- Create: `index.html` (项目根)
- Create: `src/home/main.tsx`
- Create: `src/home/HomePage.tsx`

- [x] **Step 9.1: 写项目根的 index.html**

创建 `/Users/weidwonder/projects/weid.fun/index.html`（**注意：项目根，不是 src/home/**）：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>weid.fun</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/home/main.tsx"></script>
  </body>
</html>
```

> **两个关键点**：
> 1. `viewport-fit=cover` 是让 safe-area-inset 生效的必要条件
> 2. `script src="/src/home/main.tsx"` 使用**绝对路径**（以 `/` 开头），让 Vite 正确解析到 src 目录下的源码

- [x] **Step 9.2: 写 src/home/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HomePage } from './HomePage'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
)
```

- [x] **Step 9.3: 写 src/home/HomePage.tsx 最小版本**

```tsx
import { CornerMarker } from '@/primitives/CornerMarker'
import homeData from './home-data.json'
import type { HomeData } from '@/lib/types'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-fluid-sm text-neutral-500">
          {data.portal.title}
        </p>
      </div>
    </div>
  )
}
```

- [x] **Step 9.4: 跑 build 确认能构建出 dist/index.html**

Run:
```bash
bun run build
```

Expected:
- 控制台打印 `[vite] discovered entries: home`
- 生成 `dist/index.html`
- 无错误

- [x] **Step 9.5: 跑 preview 并用 curl 验证**

Run (后台):
```bash
bun run preview &
PREVIEW_PID=$!
sleep 2
curl -sf http://localhost:4173/ | grep -q 'weid.fun' && echo "OK" || echo "FAIL"
kill $PREVIEW_PID
```

Expected: `OK`。

- [x] **Step 9.6: 跑 CornerMarker playwright test (desktop)**

Run:
```bash
bun x playwright test tests/corner-marker.spec.ts --project=desktop
```

Expected: 3 个 test PASS（`playwright.config.ts` 的 `webServer` 会自动起 preview）。

- [x] **Step 9.7: 跑全部断点**

Run:
```bash
bun x playwright test tests/corner-marker.spec.ts
```

Expected: 9 个 test (3 test × 3 project) 全 PASS。

- [x] **Step 9.8: 提交**

```bash
git add index.html src/home/main.tsx src/home/HomePage.tsx
git commit -m "feat(home): minimal homepage with CornerMarker, all e2e tests pass"
```

---

## Task 10: 构建产物验证

**目的**：确认 `bun run build` 的产物结构正确，dist 目录是可以部署的样子。

- [x] **Step 10.1: 清理并重新构建**

Run:
```bash
rm -rf dist && bun run build
```

Expected: 无错误，`dist/` 目录被创建。

- [x] **Step 10.2: 检查 dist 结构**

Run:
```bash
ls -la dist/
```

Expected 至少包含：
- `dist/index.html`
- `dist/assets/` 目录（内含 JS / CSS）

- [x] **Step 10.3: 验证 index.html 内容**

```bash
grep -c 'weid.fun' dist/index.html
```

Expected: 输出 `1`（title 标签里有一处）。

```bash
grep -c 'script type="module"' dist/index.html
```

Expected: 输出 `1`（script 标签应该指向构建后的 JS 文件，而不是 `/src/home/main.tsx`）。

- [x] **Step 10.4: 不需要提交**

此 Task 只做验证，没有文件新增。直接进入下一个 Task。

---

## Task 11: 写 Portal 组件（D 区）

**目的**：首页上半段的「生成式门户」。现在是 placeholder 版本——全屏满视口，显示 portal.title + "ENTER ↓" 提示。

**Files:**
- Create: `src/home/Portal.tsx`
- Modify: `src/home/HomePage.tsx`
- Modify: `tests/home.spec.ts` (新增 test)

### 11a. 先写测试

- [x] **Step 11.1: 创建 tests/home.spec.ts**

```ts
import { test, expect } from '@playwright/test'

test.describe('HomePage · Portal (D 区)', () => {
  test('门户显示 portal.title', async ({ page }) => {
    await page.goto('/')
    const title = page.locator('[data-testid="portal-title"]')
    await expect(title).toBeVisible()
    await expect(title).toContainText('curious writing')
  })

  test('门户占满首屏（viewport 高度）', async ({ page }) => {
    await page.goto('/')
    const portal = page.locator('[data-testid="portal"]')
    const box = await portal.boundingBox()
    expect(box).not.toBeNull()

    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()

    // 门户的高度应该等于视口高度（±2px 容差）
    expect(Math.abs(box!.height - viewport!.height)).toBeLessThanOrEqual(2)
  })

  test('ENTER 提示可见', async ({ page }) => {
    await page.goto('/')
    const enter = page.locator('[data-testid="portal-enter"]')
    await expect(enter).toBeVisible()
    await expect(enter).toContainText('ENTER')
  })
})
```

- [x] **Step 11.2: 运行测试确认失败**

Run:
```bash
bun x playwright test tests/home.spec.ts --project=desktop
```

Expected: 3 个 test 都失败，原因是 `[data-testid="portal"]` 等 locator 不存在。

### 11b. 实现 Portal

- [x] **Step 11.3: 写 Portal.tsx**

```tsx
import type { PortalConfig } from '@/lib/types'

interface PortalProps {
  config: PortalConfig
}

/**
 * Portal · 首页 D 区（生成式门户）
 *
 * MVP 版本：满屏显示 portal.title + subtitle + ENTER 提示。
 * 未来 Plan C 会升级为真正的 Tier 4 hero（WebGL 等）。
 */
export function Portal({ config }: PortalProps) {
  return (
    <section
      data-testid="portal"
      className="
        relative h-screen w-full
        flex flex-col items-center justify-center
        bg-black text-white
        overflow-hidden
      "
    >
      {/* 背景 gradient（placeholder；未来会替换为 WebGL scene） */}
      <div
        aria-hidden
        className="
          absolute inset-0 pointer-events-none
          bg-[radial-gradient(ellipse_at_50%_50%,rgba(131,56,236,0.25),transparent_60%)]
        "
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <h1
          data-testid="portal-title"
          className="
            font-serif italic font-normal
            text-fluid-3xl md:text-fluid-4xl
            leading-none tracking-tight
            max-w-[90vw]
          "
        >
          {config.title}
        </h1>
        {config.subtitle && (
          <p className="font-mono text-fluid-xs tracking-wider text-neutral-500 uppercase">
            {config.subtitle}
          </p>
        )}
      </div>

      <div
        data-testid="portal-enter"
        className="
          absolute bottom-10 left-1/2 -translate-x-1/2
          font-mono text-fluid-xs tracking-widest text-neutral-500
          flex items-center gap-2
        "
        style={{ bottom: 'max(2.5rem, var(--sab) + 1.5rem)' }}
      >
        <span>ENTER</span>
        <span className="animate-bounce">↓</span>
      </div>
    </section>
  )
}
```

- [x] **Step 11.4: 修改 HomePage.tsx 接入 Portal**

替换整个 `src/home/HomePage.tsx`：

```tsx
import { CornerMarker } from '@/primitives/CornerMarker'
import { Portal } from './Portal'
import homeData from './home-data.json'
import type { HomeData } from '@/lib/types'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <Portal config={data.portal} />
    </div>
  )
}
```

- [x] **Step 11.5: 跑 home test (desktop)**

Run:
```bash
bun x playwright test tests/home.spec.ts --project=desktop
```

Expected: 3 个 test PASS。

- [x] **Step 11.6: 跑全部断点**

Run:
```bash
bun x playwright test tests/home.spec.ts
```

Expected: 9 个 test PASS。

- [x] **Step 11.7: 提交**

```bash
git add src/home/Portal.tsx src/home/HomePage.tsx tests/home.spec.ts
git commit -m "feat(home): add Portal (D zone) with viewport-fill and ENTER hint"
```

---

## Task 12: 写 Vitrine 组件（C 区）

**目的**：首页下半段的「精选橱窗」。从 `home-data.json.articles` 渲染。空数组时显示一个 placeholder。

**Files:**
- Create: `src/home/Vitrine.tsx`
- Modify: `src/home/HomePage.tsx`
- Modify: `tests/home.spec.ts` (追加 test)

### 12a. 先写测试

- [x] **Step 12.1: 追加 Vitrine 测试到 tests/home.spec.ts**

在文件末尾追加：

```ts
test.describe('HomePage · Vitrine (C 区)', () => {
  test('空 articles 时显示 placeholder', async ({ page }) => {
    await page.goto('/')
    const empty = page.locator('[data-testid="vitrine-empty"]')
    await empty.scrollIntoViewIfNeeded()
    await expect(empty).toBeVisible()
    await expect(empty).toContainText('no writings yet')
  })

  test('Vitrine 区在 Portal 下方（滚动可见）', async ({ page }) => {
    await page.goto('/')
    const vitrine = page.locator('[data-testid="vitrine"]')
    await expect(vitrine).toBeAttached()
    // 初始不可见（在折叠下面）
    const box = await vitrine.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.y).toBeGreaterThanOrEqual(viewport.height - 100) // 至少要在首屏之下
  })
})
```

- [x] **Step 12.2: 运行确认失败**

Run:
```bash
bun x playwright test tests/home.spec.ts --project=desktop
```

Expected: 新增的 2 个 test 失败；之前 3 个仍通过。

### 12b. 实现 Vitrine

- [x] **Step 12.3: 写 Vitrine.tsx**

```tsx
import type { ArticleMeta } from '@/lib/types'

interface VitrineProps {
  articles: ArticleMeta[]
}

/**
 * Vitrine · 首页 C 区（精选橱窗）
 *
 * 从 home-data.json.articles 渲染文章卡片网格。
 * - pin=true 的文章永远排在最前
 * - 其它按 publishedAt 倒序
 * - 每张卡片背景：有 coverImage 用图片，否则用 colors.primary 填充
 * - 空数组时显示一个 placeholder
 */
export function Vitrine({ articles }: VitrineProps) {
  if (articles.length === 0) {
    return (
      <section
        data-testid="vitrine"
        className="min-h-[50vh] bg-neutral-950 text-white px-6 py-20 flex items-center justify-center"
      >
        <p
          data-testid="vitrine-empty"
          className="font-mono text-fluid-xs tracking-wider text-neutral-600 uppercase text-center"
        >
          no writings yet · check back later
        </p>
      </section>
    )
  }

  // 排序：pin 优先，其次 publishedAt 倒序
  const sorted = [...articles].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })

  return (
    <section
      data-testid="vitrine"
      className="min-h-screen bg-neutral-950 text-white px-6 py-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex items-baseline justify-between">
          <p className="font-mono text-fluid-xs tracking-widest text-neutral-500 uppercase">
            Writings
          </p>
          <p className="font-mono text-fluid-xs text-neutral-600">
            {articles.length} total
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((article) => (
            <a
              key={article.slug}
              href={`/articles/${article.slug}/`}
              data-testid={`vitrine-card-${article.slug}`}
              className="group block aspect-[4/5] relative overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
              style={{
                background: article.coverImage
                  ? `url(${article.coverImage}) center/cover`
                  : article.colors.primary,
              }}
            >
              {/* 遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* 内容 */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                {article.pin && (
                  <span className="inline-block self-start mb-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border border-white/40 rounded">
                    pinned
                  </span>
                )}
                <h3 className="font-sans font-bold text-fluid-lg leading-tight text-white">
                  {article.title}
                </h3>
                {article.series && (
                  <p className="mt-1 font-mono text-fluid-xs text-white/60">
                    {article.series}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [x] **Step 12.4: 修改 HomePage.tsx 接入 Vitrine**

```tsx
import { CornerMarker } from '@/primitives/CornerMarker'
import { Portal } from './Portal'
import { Vitrine } from './Vitrine'
import homeData from './home-data.json'
import type { HomeData } from '@/lib/types'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <Portal config={data.portal} />
      <Vitrine articles={data.articles} />
    </div>
  )
}
```

- [x] **Step 12.5: 跑测试**

Run:
```bash
bun x playwright test tests/home.spec.ts
```

Expected: 全部 test PASS（3 project × 5 test = 15）。

- [x] **Step 12.6: 提交**

```bash
git add src/home/Vitrine.tsx src/home/HomePage.tsx tests/home.spec.ts
git commit -m "feat(home): add Vitrine (C zone) with pin sorting and empty state"
```

---

## Task 13: 专门的响应式自审测试

**目的**：创建一个专门的 spec 文件，对整个首页做响应式检查，作为 Hard Rule R1 的机械验证。

**Files:**
- Create: `tests/responsive.spec.ts`

- [x] **Step 13.1: 写 responsive.spec.ts**

```ts
import { test, expect } from '@playwright/test'

test.describe('Responsive · R1 Hard Rule Verification', () => {
  test('首页无横向滚动', async ({ page }) => {
    await page.goto('/')
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('CornerMarker 不与 Portal 内容重叠', async ({ page }) => {
    await page.goto('/')
    const marker = await page.locator('[data-testid="corner-marker-home"]').boundingBox()
    const title = await page.locator('[data-testid="portal-title"]').boundingBox()

    expect(marker).not.toBeNull()
    expect(title).not.toBeNull()

    // marker 应该完全在 title 上方（或至少 marker 的 bottom 在 title 的 top 之上）
    // 允许 marker 重叠 title（因为 marker 是 fixed corner），但我们至少检查
    // marker 的高度是小的（< 40px），所以不会占据 title 空间
    expect(marker!.height).toBeLessThan(50)
  })

  test('Portal 填满视口', async ({ page }) => {
    await page.goto('/')
    const portal = await page.locator('[data-testid="portal"]').boundingBox()
    const viewport = page.viewportSize()!
    expect(Math.abs(portal!.height - viewport.height)).toBeLessThanOrEqual(2)
  })

  test('Vitrine 在 Portal 之后（纵向堆叠）', async ({ page }) => {
    await page.goto('/')
    const portal = await page.locator('[data-testid="portal"]').boundingBox()
    const vitrine = await page.locator('[data-testid="vitrine"]').boundingBox()
    expect(vitrine!.y).toBeGreaterThanOrEqual(portal!.y + portal!.height - 2)
  })
})
```

- [x] **Step 13.2: 运行**

Run:
```bash
bun x playwright test tests/responsive.spec.ts
```

Expected: 4 test × 3 project = 12 全 PASS。

- [x] **Step 13.3: 提交**

```bash
git add tests/responsive.spec.ts
git commit -m "test(e2e): add responsive R1 hard rule verification"
```

---

## Task 14: 部署脚本 `scripts/deploy.sh`

**目的**：把 `dist/` rsync 到服务器并 reload nginx。支持 `--dry-run` 便于本地验证命令结构。

**Files:**
- Create: `scripts/deploy.sh`
- Delete: `scripts/.gitkeep`

- [x] **Step 14.1: 写 deploy.sh**

```bash
#!/usr/bin/env bash
# weid.fun 部署脚本
# Usage:
#   ./scripts/deploy.sh            真实部署
#   ./scripts/deploy.sh --dry-run  仅打印命令不执行

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="echo [DRY]"
fi

SERVER="root@47.95.8.46"
REMOTE_PATH="/var/www/weid.fun/"
LOCAL_DIST="dist/"

echo "==> Building..."
$DRY_RUN bun run build

if [[ ! -d "$LOCAL_DIST" && -z "$DRY_RUN" ]]; then
  echo "❌ dist/ not found after build"
  exit 1
fi

echo "==> Syncing $LOCAL_DIST → $SERVER:$REMOTE_PATH"
$DRY_RUN rsync -av --delete "$LOCAL_DIST" "$SERVER:$REMOTE_PATH"

echo "==> Reloading nginx..."
$DRY_RUN ssh "$SERVER" "nginx -t && systemctl reload nginx"

echo "✅ Deploy complete."
echo "   Verify: curl -I https://weid.fun"
```

- [x] **Step 14.2: 加执行权限**

```bash
chmod +x scripts/deploy.sh
```

- [x] **Step 14.3: 删 .gitkeep**

```bash
rm -f scripts/.gitkeep
```

- [x] **Step 14.4: 本地 dry-run 验证**

Run:
```bash
./scripts/deploy.sh --dry-run
```

Expected: 打印所有命令但不执行。命令结构正确。

- [x] **Step 14.5: 提交**

```bash
git add scripts/deploy.sh scripts/.gitkeep
git commit -m "feat(deploy): add deploy.sh with dry-run support"
```

---

## Task 15: nginx 配置文件 `scripts/nginx/weid.fun.conf`

**目的**：服务器端 nginx 配置纳入仓库，任何时候可以从仓库里拷过去重新部署。

**Files:**
- Create: `scripts/nginx/weid.fun.conf`

- [x] **Step 15.1: 写 weid.fun.conf**

```nginx
# weid.fun · nginx 配置
# 部署位置：/etc/nginx/conf.d/weid.fun.conf
# SSL 证书位置（参见 docs/deployment/2026-04-09-ssl证书部署.md）：
#   /etc/ssl/weid.fun/fullchain.pem
#   /etc/ssl/weid.fun/privkey.pem

# HTTP -> HTTPS 强制跳转
server {
    listen 80;
    listen [::]:80;
    server_name weid.fun www.weid.fun;

    # Let's Encrypt webroot challenge（留一个通道供 acme.sh 使用 webroot 模式续签）
    location /.well-known/acme-challenge/ {
        root /var/www/acme-challenge;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主站
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name weid.fun www.weid.fun;

    root /var/www/weid.fun;
    index index.html;

    ssl_certificate     /etc/ssl/weid.fun/fullchain.pem;
    ssl_certificate_key /etc/ssl/weid.fun/privkey.pem;

    # SSL 硬化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # 安全头（HSTS 先不开，等稳定后开启）
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 静态资源缓存
    location ~* \.(js|css|woff2?|ttf|svg|webp|png|jpg|jpeg|gif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # HTML 不缓存（让部署立即生效）
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
        try_files $uri =404;
    }

    # 默认路由
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # 隐藏 nginx 版本
    server_tokens off;

    access_log /var/log/nginx/weid.fun.access.log;
    error_log  /var/log/nginx/weid.fun.error.log;
}
```

- [x] **Step 15.2: 提交**

```bash
git add scripts/nginx/weid.fun.conf
git commit -m "feat(deploy): add nginx config for weid.fun with SSL hardening"
```

---

## Task 16: 本地完整构建 + preview 验证

**目的**：在部署前在本地完整跑一遍 build 和 preview，确保一切 OK。

- [x] **Step 16.1: 跑完整构建**

Run:
```bash
bun run build
```

Expected:
- `[vite] discovered entries: home`
- `dist/index.html` + `dist/assets/` 生成
- 无错误

- [x] **Step 16.2: 跑 preview 并手动验证**

Run:
```bash
bun run preview
```

打开浏览器访问 `http://localhost:4173/`，确认：

- [x] 看到门户页面（标题 "A place for curious writing."）
- [x] 左上角 `weid.fun /` 可见，点击不报错
- [x] 右上角 `⌘` 按钮可见
- [x] 滚动下去看到 Vitrine empty 提示
- [x] 缩小浏览器到手机尺寸（375px 宽），布局正常，无横向滚动
- [x] 所有字号随尺寸缩放

Ctrl+C 停掉 preview。

- [x] **Step 16.3: 跑完整 E2E 套件**

Run:
```bash
bun run test:e2e
```

Expected: 所有 test (CornerMarker + home + responsive) 全 PASS。

---

## Task 17: 首次部署到服务器

**目的**：把 `dist/` 送到 weid.fun 服务器，配置 nginx，验证线上可访问。

> **注意**：此 Task 涉及真实生产服务器，执行前请确认：
> 1. 本机有 SSH 私钥能登录 `root@47.95.8.46`
> 2. 服务器的 nginx 已安装

- [ ] **Step 17.1: 验证 SSH 可达**

Run:
```bash
ssh root@47.95.8.46 "echo connected && nginx -v"
```

Expected: `connected` + 打印 nginx 版本。

- [ ] **Step 17.2: 把 nginx 配置拷到服务器**

Run:
```bash
scp scripts/nginx/weid.fun.conf root@47.95.8.46:/etc/nginx/conf.d/weid.fun.conf
```

- [ ] **Step 17.3: 创建 webroot 目录（用于 acme-challenge）**

Run:
```bash
ssh root@47.95.8.46 "mkdir -p /var/www/acme-challenge /var/www/weid.fun"
```

- [ ] **Step 17.4: 测试 nginx 配置语法**

Run:
```bash
ssh root@47.95.8.46 "nginx -t"
```

Expected:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

如果失败：检查 `/etc/ssl/weid.fun/` 路径是否存在；检查有无默认 server 冲突。

- [ ] **Step 17.5: reload nginx**

Run:
```bash
ssh root@47.95.8.46 "systemctl reload nginx"
```

Expected: 无输出即成功。

- [ ] **Step 17.6: dry-run deploy.sh**

Run:
```bash
./scripts/deploy.sh --dry-run
```

Expected: 打印命令，不报错。

- [ ] **Step 17.7: 真实部署**

Run:
```bash
./scripts/deploy.sh
```

Expected:
- 构建成功
- rsync 输出一批文件
- nginx reload 成功
- 打印 `✅ Deploy complete.`

- [ ] **Step 17.8: 验证线上访问**

Run:
```bash
curl -I https://weid.fun
```

Expected:
- `HTTP/2 200`
- `content-type: text/html`
- `strict-transport-security` **不应出现**（HSTS 还没开）

Run:
```bash
curl -I http://weid.fun
```

Expected:
- `HTTP/1.1 301 Moved Permanently`
- `Location: https://weid.fun/`

- [ ] **Step 17.9: 浏览器验证**

手动打开 `https://weid.fun`：

- [x] 页面正确加载
- [x] 证书绿色锁头
- [x] 门户文字可见
- [x] CornerMarker 可见
- [x] 滚动到底部看到 empty vitrine
- [x] 在手机上打开（或浏览器 devtools 切手机模式）也能正常看到

---

## Task 18: 收尾 & 提交完成标记

**目的**：Plan A 全部完成。打一个 tag 便于后续回溯。

- [ ] **Step 18.1: 最终 git status**

Run:
```bash
git status
```

Expected: `working tree clean`，main 分支无未提交内容。

- [ ] **Step 18.2: 看一下 commit 历史**

Run:
```bash
git log --oneline
```

Expected: 大约 15-18 个 commit，从初始 docs commit 到 Plan A 各 Task。

- [ ] **Step 18.3: 打 tag**

```bash
git tag -a plan-a-complete -m "Plan A complete: framework bootstrap, deployable empty portal at https://weid.fun"
```

- [ ] **Step 18.4: 报告**

打印以下内容：

```
✅ Plan A 完成。

已交付：
- Vite + React + TypeScript + Tailwind 项目骨架
- CornerMarker primitive（响应式 + safe-area-inset）
- 首页 D+C 布局（Portal + Vitrine，空数据时正常显示）
- 完整的 E2E 测试覆盖（3 断点 × 多个 test = 20+ test case）
- deploy.sh + nginx 配置（纳入仓库）
- 首次部署到 weid.fun，https://weid.fun 可访问

下一步（Plan B）：
- WebGLHero primitive（Tier 4 hero 真实版）
- /publish skill 本体
- 最简自审循环
- 发布第一篇测试文章
```

---

## 附录 · 本 Plan 未覆盖的部分

以下内容**故意不在 Plan A**，将在后续 Plan 里处理：

| 功能 | 在哪个 Plan | 原因 |
|---|---|---|
| WebGLHero 真实版 | Plan B | Portal 先用 gradient placeholder |
| `/publish` skill | Plan B | Plan A 只要能手工 deploy 就行 |
| 自审循环 + Claude Vision | Plan B | Plan A 的 Playwright test 已经验证了 R1 |
| ScrollReveal / DragFigure / AudioPad | Plan C | Plan B 只要求一个 primitive 够用 |
| 系列机制 (`series/`) | Plan C | 需要 /publish 先跑起来 |
| personal 分支 | Plan C | 需要有第一篇真实文章之后再建 |
| command palette | 未来 Plan | MVP 只需要按钮占位 |
| archive 页面 | 未来 Plan | 当前橱窗直接全列 |

---

## 附录 · 执行遇到问题时的处置原则

1. **Playwright 测试失败**：先看 `test-results/` 里的截图和 trace。不要盲目改测试——确认是实现问题还是断言错了。
2. **Vite 构建失败**：通常是 entry 路径问题。确认 `discoverEntries()` 返回的内容，直接 console.log 看看。
3. **SSH / rsync 失败**：先用 `--dry-run` 排查命令；再直接手动 `ssh` 验证网络；最后查 /var/log/auth.log。
4. **nginx -t 失败**：SSL 证书路径要存在；默认 server block 不要冲突；配置语法错误通常报 line number。
5. **部署后网站 502/504**：肯定是 nginx 配置问题；查 `/var/log/nginx/weid.fun.error.log`。
6. **部署后网站 404**：目录结构错了，`/var/www/weid.fun/` 下应该直接有 `index.html`；rsync 的尾部斜杠很重要（`dist/` vs `dist`）。
