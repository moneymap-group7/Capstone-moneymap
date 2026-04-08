import { test, expect } from '@playwright/test';

test('transactions page loads', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  await page.getByPlaceholder(/password/i).fill('83344@Het');

  await page.getByRole('button', { name: /login/i }).click();

  await page.goto('http://localhost:5173/transactions');

  await expect(page.locator('table')).toBeVisible();
});