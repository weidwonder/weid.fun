import { expect, test } from '@playwright/test'

test.describe('Review regressions', () => {
  test('AudioPad 在 src 变化后会从 error 状态恢复', async ({ page }) => {
    await page.goto('/src/playground/audio-pad-reset/')

    await expect(page.getByText(/audio unavailable/i)).toBeVisible()

    await page.getByTestId('audio-pad-reset-src').click()

    await expect(page.getByText(/audio unavailable/i)).toHaveCount(0)
    await expect(page.getByTestId('audio-pad-toggle')).toBeVisible()
  })

  test('DragFigure 在父组件更新 initialX / initialY 后同步位置', async ({ page }) => {
    await page.goto('/src/playground/drag-figure-sync/')

    const target = page.getByTestId('drag-figure-sync-target')
    const before = await target.boundingBox()
    expect(before).not.toBeNull()

    await page.getByTestId('drag-figure-sync-button').click()

    const after = await target.boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs(after!.x - before!.x)).toBeGreaterThan(100)
    expect(Math.abs(after!.y - before!.y)).toBeGreaterThan(60)
  })
})
