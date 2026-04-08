import { test, expect } from '@playwright/test';

test('redirect if not authenticated', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');
  await expect(page).toHaveURL(/login/);
});

test('allow access after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  await page.getByPlaceholder(/password/i).fill('83344@Het');

  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/dashboard|home/);
});