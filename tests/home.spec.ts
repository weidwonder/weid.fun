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
