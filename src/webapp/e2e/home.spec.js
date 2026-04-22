// @ts-check
const { test, expect } = require('@playwright/test');

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check if the page title is correct
  await expect(page).toHaveTitle('Blockchain Dashboard');
  
  // Check if the header is present
  await expect(page.locator('h1')).toContainText('Blockchain Dashboard');
  
  // Check if tabs are present
  await expect(page.locator('.tab')).toHaveCount(3);
  
  // Check if Monitor tab is active by default
  await expect(page.locator('.tab.active')).toContainText('Monitor');
});

test('tabs navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Click on Charts tab
  await page.click('text=Charts');
  await expect(page.locator('.tab.active')).toContainText('Charts');
  
  // Click on Meme tab
  await page.click('text=Meme');
  await expect(page.locator('.tab.active')).toContainText('Meme');
  
  // Click on Monitor tab
  await page.click('text=Monitor');
  await expect(page.locator('.tab.active')).toContainText('Monitor');
});
