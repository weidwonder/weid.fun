import { describe, expect, test } from 'bun:test'
import sharp from 'sharp'
import { extractDominantColor } from './extract-palette.ts'

describe('extract-palette helpers', () => {
  test('极亮图片不会退化成默认紫色', async () => {
    const imgPath = '/tmp/weid-fun-palette-bright.png'

    await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 250, g: 248, b: 240 },
      },
    })
      .png()
      .toFile(imgPath)

    const color = await extractDominantColor(imgPath)
    expect(color).not.toBe('#8338ec')
  })
})
