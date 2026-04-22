import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays dashboard title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Blockchain Dashboard')
  })

  test('shows tabs navigation', async ({ page }) => {
    await expect(page.locator('.tabs')).toBeVisible()
    await expect(page.getByRole('button', { name: /Monitor|Charts|Meme|Dashboard|Lido|Aave/i })).toHaveCount(6)
  })

  test('switches tabs', async ({ page }) => {
    await page.getByRole('button', { name: /Lido/i }).click()
    await expect(page.locator('.lido-view')).toBeVisible()
  })

  test('opens settings modal', async ({ page }) => {
    await page.getByRole('button', { name: /Settings/i }).click()
    await expect(page.locator('.modal')).toBeVisible()
  })
})

test.describe('Settings Modal', () => {
  test('theme selector works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Settings/i }).click()
    const themeButtons = page.locator('.theme-btn')
    await expect(themeButtons).toHaveCount(3)
  })
})
