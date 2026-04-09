import { test, expect } from '@playwright/test';

test('upload CSV happy path', async ({ page }) => {

  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  await page.getByPlaceholder(/password/i).fill('83344@Het)');

  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/dashboard|home/);

  // go to upload page
  await page.goto('http://localhost:5173/upload');

  await page.setInputFiles('input[type="file"]', 'e2e/sample.csv');
  await page.getByRole('button', { name: /upload|submit/i }).click();

  await expect(page).toHaveURL(/transactions|dashboard/);
});