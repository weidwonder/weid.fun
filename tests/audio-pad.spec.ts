import { expect, test } from '@playwright/test'

test.describe('AudioPad primitive', () => {
  test('初始显示「播放」按钮', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await expect(button).toBeVisible()
    await expect(button).toContainText(/play/i)
  })

  test('点击后变为「暂停」状态', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await button.click()
    await expect(button).toContainText(/pause/i)
  })

  test('再次点击变回播放状态', async ({ page }) => {
    await page.goto('/src/playground/audio-pad/')
    const button = page.locator('[data-testid="audio-pad-toggle"]')
    await button.click()
    await button.click()
    await expect(button).toContainText(/play/i)
  })
})
