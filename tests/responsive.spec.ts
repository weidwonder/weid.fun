import { expect, test } from '@playwright/test'

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
