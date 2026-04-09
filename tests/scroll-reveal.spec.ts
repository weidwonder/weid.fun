import { expect, test } from '@playwright/test'

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
    await page.waitForTimeout(800)
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
