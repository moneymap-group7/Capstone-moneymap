# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: insights.spec.ts >> insights page loads
- Location: e2e/insights.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('canvas')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('canvas')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "MoneyMap" [ref=e4] [cursor=pointer]:
      - /url: /
      - generic [ref=e5]: MoneyMap
    - generic [ref=e6]:
      - link "Login" [ref=e7] [cursor=pointer]:
        - /url: /login
      - link "Register" [ref=e8] [cursor=pointer]:
        - /url: /register
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]: Secure personal finance access
      - heading "Welcome back to MoneyMap." [level=1] [ref=e13]:
        - text: Welcome back to
        - text: MoneyMap.
      - paragraph [ref=e14]: Sign in to upload statements, review transactions, manage budgets, and explore your spending insights in one place.
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "Login" [level=1] [ref=e18]
        - paragraph [ref=e19]: Sign in to continue using MoneyMap.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Email
          - generic [ref=e23]:
            - textbox "Enter your email" [ref=e24]
            - img
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]: Password
            - link "Forgot password?" [ref=e28] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e29]:
            - textbox "Enter your password" [ref=e30]
            - button "Show password" [ref=e31] [cursor=pointer]:
              - img [ref=e32]
        - button "Login" [ref=e35] [cursor=pointer]
      - generic [ref=e36]:
        - text: Don't have an account?
        - link "Register" [ref=e37] [cursor=pointer]:
          - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('insights page loads', async ({ page }) => {
  4  |   await page.goto('http://localhost:5173/login');
  5  | 
  6  |   await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  7  |   await page.getByPlaceholder(/password/i).fill('83344@Het');
  8  | 
  9  |   await page.getByRole('button', { name: /login/i }).click();
  10 | 
  11 |   await page.goto('http://localhost:5173/insights');
  12 | 
> 13 |   await expect(page.locator('canvas')).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  14 | });
```