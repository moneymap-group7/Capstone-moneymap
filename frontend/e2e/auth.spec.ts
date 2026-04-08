import { test, expect } from '@playwright/test';

test('login and logout flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  await page.getByPlaceholder(/password/i).fill('83344@Het');

  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/dashboard|home/);

  // logout
  await page.getByRole('button', { name: /logout/i }).click();

  await expect(page).toHaveURL(/login/);
});