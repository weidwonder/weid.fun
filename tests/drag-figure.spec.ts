import { expect, test } from '@playwright/test'

test.describe('DragFigure primitive', () => {
  test('可以通过 mouse 拖拽移动位置', async ({ page }) => {
    await page.goto('/src/playground/drag-figure/')
    const handle = page.locator('[data-testid="drag-figure"]')
    const startBox = await handle.boundingBox()
    expect(startBox).not.toBeNull()

    const startX = startBox!.x + startBox!.width / 2
    const startY = startBox!.y + startBox!.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 150, startY + 100, { steps: 10 })
    await page.mouse.up()

    const endBox = await handle.boundingBox()
    expect(Math.abs(endBox!.x - startBox!.x)).toBeGreaterThan(100)
  })

  test('mobile 上可以 touch 拖拽', async ({ page }) => {
    await page.goto('/src/playground/drag-figure/')
    const handle = page.locator('[data-testid="drag-figure"]')
    const startBox = await handle.boundingBox()
    expect(startBox).not.toBeNull()

    await handle.dispatchEvent('pointerdown', {
      clientX: startBox!.x + 20,
      clientY: startBox!.y + 20,
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      buttons: 1,
    })
    await handle.dispatchEvent('pointermove', {
      clientX: startBox!.x + 120,
      clientY: startBox!.y + 80,
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      buttons: 1,
    })
    await handle.dispatchEvent('pointerup', {
      clientX: startBox!.x + 120,
      clientY: startBox!.y + 80,
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      buttons: 0,
    })

    const endBox = await handle.boundingBox()
    expect(Math.abs(endBox!.x - startBox!.x)).toBeGreaterThan(50)
  })
})
