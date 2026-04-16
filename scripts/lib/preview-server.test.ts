import net from 'node:net'
import { afterEach, describe, expect, test } from 'bun:test'
import { assertPortAvailable } from './preview-server.ts'

const servers: net.Server[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error)
            else resolve()
          })
        }),
    ),
  )
})

describe('preview server helpers', () => {
  test('assertPortAvailable rejects when port is already occupied', async () => {
    const server = net.createServer()
    servers.push(server)

    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => resolve())
      server.once('error', reject)
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('expected TCP server address')
    }

    await expect(assertPortAvailable(address.port, '127.0.0.1')).rejects.toThrow(/already in use/i)
  })
})
