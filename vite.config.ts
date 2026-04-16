import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

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
    home: resolve(projectRoot, 'index.html'),
  }

  const articlesRoot = path.resolve(projectRoot, 'src/articles')
  if (fs.existsSync(articlesRoot)) {
    for (const item of fs.readdirSync(articlesRoot, { withFileTypes: true })) {
      if (!item.isDirectory()) continue
      const entry = path.join(articlesRoot, item.name, 'index.html')
      if (fs.existsSync(entry)) {
        entries[`articles_${item.name}`] = entry
      }
    }
  }

  const playgroundRoot = path.resolve(projectRoot, 'src/playground')
  if (fs.existsSync(playgroundRoot)) {
    for (const item of fs.readdirSync(playgroundRoot, { withFileTypes: true })) {
      if (!item.isDirectory()) continue
      const entry = path.join(playgroundRoot, item.name, 'index.html')
      if (fs.existsSync(entry)) {
        entries[`playground_${item.name}`] = entry
      }
    }
  }

  const seriesRoot = path.resolve(projectRoot, 'src/series')
  if (fs.existsSync(seriesRoot)) {
    for (const item of fs.readdirSync(seriesRoot, { withFileTypes: true })) {
      if (!item.isDirectory()) continue
      const entry = path.join(seriesRoot, item.name, 'index.html')
      if (fs.existsSync(entry)) {
        entries[`series_${item.name}`] = entry
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
        '@': resolve(projectRoot, './src'),
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
