# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: upload.spec.ts >> upload CSV happy path
- Location: e2e/upload.spec.ts:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard|home/
Received string:  "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:5173/login"

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
      - generic [ref=e20]: Invalid email or password.
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Email
          - generic [ref=e24]:
            - textbox "Enter your email" [ref=e25]: hetcanadian@gmail.com
            - img
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]: Password
            - link "Forgot password?" [ref=e29] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e30]:
            - textbox "Enter your password" [ref=e31]: 83344@Het)
            - button "Show password" [ref=e32] [cursor=pointer]:
              - img [ref=e33]
        - button "Login" [ref=e36] [cursor=pointer]
      - generic [ref=e37]:
        - text: Don't have an account?
        - link "Register" [ref=e38] [cursor=pointer]:
          - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('upload CSV happy path', async ({ page }) => {
  4  |   // go to login
  5  |   await page.goto('http://localhost:5173/login');
  6  | 
  7  |   // ✅ FIXED selectors (no more name=email issue)
  8  |   await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  9  |   await page.getByPlaceholder(/password/i).fill('83344@Het)');
  10 | 
  11 |   await page.getByRole('button', { name: /login/i }).click();
  12 | 
  13 |   // wait for login success
> 14 |   await expect(page).toHaveURL(/dashboard|home/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  15 | 
  16 |   // go to upload page
  17 |   await page.goto('http://localhost:5173/upload');
  18 | 
  19 |   // ✅ FIXED path (no __dirname issues)
  20 |   await page.setInputFiles('input[type="file"]', 'e2e/sample.csv');
  21 | 
  22 |   // click upload
  23 |   await page.getByRole('button', { name: /upload|submit/i }).click();
  24 | 
  25 |   // ✅ flexible success check
  26 |   await expect(page).toHaveURL(/transactions|dashboard/);
  27 | });
```