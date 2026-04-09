import { expect, test } from '@playwright/test'

test.describe('CornerMarker', () => {
  test('左上角显示站点名且点击回首页', async ({ page }) => {
    await page.goto('/')

    const siteName = page.locator('[data-testid="corner-marker-home"]')
    await expect(siteName).toBeVisible()
    await expect(siteName).toContainText('weid.fun')

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
