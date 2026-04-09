import { expect, test } from '@playwright/test'

test.describe('WebGLHero primitive', () => {
  test('canvas 元素挂载成功', async ({ page }) => {
    await page.goto('/src/playground/webgl-hero/')
    const canvas = page.locator('[data-testid="webgl-hero"] canvas')
    await expect(canvas).toBeVisible()
  })

  test('hero 满视口', async ({ page }) => {
    await page.goto('/src/playground/webgl-hero/')
    const hero = page.locator('[data-testid="webgl-hero"]')
    const box = await hero.boundingBox()
    const viewport = page.viewportSize()!
    expect(Math.abs(box!.height - viewport.height)).toBeLessThanOrEqual(2)
  })

  test('标题文字可见', async ({ page }) => {
    await page.goto('/src/playground/webgl-hero/')
    await expect(page.locator('[data-testid="webgl-hero-title"]')).toBeVisible()
  })

  test('mobile 不出现横向滚动', async ({ page }) => {
    await page.goto('/src/playground/webgl-hero/')
    const hasHscroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHscroll).toBe(false)
  })
})
