import { expect, test } from '@playwright/test'

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

    expect(Math.abs(box!.height - viewport!.height)).toBeLessThanOrEqual(2)
  })

  test('ENTER 提示可见', async ({ page }) => {
    await page.goto('/')
    const enter = page.locator('[data-testid="portal-enter"]')
    await expect(enter).toBeVisible()
    await expect(enter).toContainText('ENTER')
  })
})

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
    const box = await vitrine.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.y).toBeGreaterThanOrEqual(viewport.height - 100)
  })
})
