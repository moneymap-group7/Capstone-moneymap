import { test, expect } from '@playwright/test';

test('create rule', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  await page.getByPlaceholder(/password/i).fill('83344@Het)');

  await page.getByRole('button', { name: /login/i }).click();

  await page.goto('http://localhost:5173/rules');

  await page.getByRole('button', { name: /create/i }).click();

  await page.fill('input[name="name"]', 'Uber Rule');
  await page.fill('input[name="keyword"]', 'Uber');

  await page.selectOption('select', 'Transport');

  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.locator('text=Uber Rule')).toBeVisible();
});