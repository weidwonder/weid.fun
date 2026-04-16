import net from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { PROJECT_ROOT } from './project.ts'

const PREVIEW_HOST = '127.0.0.1'
const PREVIEW_PORT = 4173
const PREVIEW_TIMEOUT_MS = 30_000

export const PREVIEW_BASE_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`

type CleanupEvent = 'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection'

export interface PreviewServerHandle {
  proc: ChildProcess
  stop: () => Promise<void>
}

export async function assertPortAvailable(port: number, host = PREVIEW_HOST): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const server = net.createServer()

    server.once('error', (error) => {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Preview port ${host}:${port} is already in use`))
      } else {
        reject(error)
      }
    })

    server.listen(port, host, () => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  })
}

function isProcessAlive(proc: ChildProcess): boolean {
  return proc.exitCode === null && proc.signalCode === null
}

async function waitForPreviewReady(proc: ChildProcess): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < PREVIEW_TIMEOUT_MS) {
    if (!isProcessAlive(proc)) {
      throw new Error(`preview exited early with code ${proc.exitCode ?? 'null'}`)
    }

    try {
      const response = await fetch(PREVIEW_BASE_URL, { redirect: 'manual' })
      if (response.status < 500) return
    } catch {
      // 端口还没就绪，继续轮询
    }

    await delay(250)
  }

  throw new Error('preview timeout')
}

async function waitForExit(proc: ChildProcess, timeoutMs: number): Promise<void> {
  if (!isProcessAlive(proc)) return

  await Promise.race([
    new Promise<void>((resolve) => {
      proc.once('exit', () => resolve())
    }),
    delay(timeoutMs).then(() => undefined),
  ])
}

async function terminateProcessGroup(proc: ChildProcess): Promise<void> {
  if (!proc.pid || !isProcessAlive(proc)) return

  try {
    if (process.platform === 'win32') {
      proc.kill('SIGTERM')
    } else {
      process.kill(-proc.pid, 'SIGTERM')
    }
  } catch {
    return
  }

  await waitForExit(proc, 3_000)

  if (!proc.pid || !isProcessAlive(proc)) return

  try {
    if (process.platform === 'win32') {
      proc.kill('SIGKILL')
    } else {
      process.kill(-proc.pid, 'SIGKILL')
    }
  } catch {
    // 进程可能已经退出
  }

  await waitForExit(proc, 1_000)
}

function registerCleanup(stop: () => Promise<void>): () => void {
  const listeners = new Map<CleanupEvent, (...args: unknown[]) => void>()

  const attach = (event: CleanupEvent) => {
    const handler = () => {
      void stop()
    }
    listeners.set(event, handler)
    process.once(event, handler)
  }

  attach('SIGINT')
  attach('SIGTERM')
  attach('uncaughtException')
  attach('unhandledRejection')

  return () => {
    for (const [event, handler] of listeners) {
      process.removeListener(event, handler)
    }
  }
}

export async function startPreviewServer(): Promise<PreviewServerHandle> {
  await assertPortAvailable(PREVIEW_PORT)

  const proc = spawn('bun', ['run', 'preview'], {
    cwd: PROJECT_ROOT,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
  })

  const removeCleanup = registerCleanup(async () => {
    await terminateProcessGroup(proc)
  })

  try {
    await waitForPreviewReady(proc)
  } catch (error) {
    removeCleanup()
    await terminateProcessGroup(proc)
    throw error
  }

  return {
    proc,
    stop: async () => {
      removeCleanup()
      await terminateProcessGroup(proc)
    },
  }
}
