import { test, expect } from '@playwright/test';

test('verify POS high density UI', async ({ page }) => {
  await page.goto('http://localhost:3007/satis');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'pos-high-density.png', fullPage: true });
});
