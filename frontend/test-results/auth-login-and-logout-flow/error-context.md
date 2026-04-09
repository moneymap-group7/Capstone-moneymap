# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> login and logout flow
- Location: e2e/auth.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /logout/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "MoneyMap" [ref=e4] [cursor=pointer]:
      - /url: /dashboard
      - generic [ref=e5]: MoneyMap
    - generic [ref=e6]:
      - link "Dashboard" [ref=e7] [cursor=pointer]:
        - /url: /dashboard
      - link "Budgets" [ref=e8] [cursor=pointer]:
        - /url: /budget
      - link "Insights" [ref=e9] [cursor=pointer]:
        - /url: /insights
      - link "Visuals" [ref=e10] [cursor=pointer]:
        - /url: /insights-visuals
      - link "Rules" [ref=e11] [cursor=pointer]:
        - /url: /rules
      - link "Categories" [ref=e12] [cursor=pointer]:
        - /url: /categories
    - button "Profile" [ref=e14] [cursor=pointer]:
      - img [ref=e16]
      - generic [ref=e21]: Profile
      - img [ref=e22]
  - generic [ref=e24]:
    - generic [ref=e25]:
      - generic [ref=e26]:
        - generic [ref=e27]: Your personal finance workspace
        - heading "Welcome to your MoneyMap dashboard." [level=1] [ref=e28]:
          - text: Welcome to your
          - text: MoneyMap dashboard.
        - paragraph [ref=e29]: MoneyMap helps you upload bank statements, review transactions, organize spending data, and explore insights from one place.
      - generic [ref=e30]:
        - heading "What you can do here" [level=3] [ref=e31]
        - generic [ref=e32]:
          - generic [ref=e33]:
            - img [ref=e35]
            - generic [ref=e38]:
              - paragraph [ref=e39]: Track spending
              - text: Keep your financial records organized and easy to review.
          - generic [ref=e40]:
            - img [ref=e42]
            - generic [ref=e44]:
              - paragraph [ref=e45]: View insights
              - text: Understand category totals, trends, and recurring activity.
          - generic [ref=e46]:
            - img [ref=e48]
            - generic [ref=e51]:
              - paragraph [ref=e52]: Stay organized
              - text: Upload statements and manage transactions more efficiently.
    - generic [ref=e53]:
      - generic [ref=e54]:
        - img [ref=e56]
        - heading "Upload Statements" [level=3] [ref=e59]
        - paragraph [ref=e60]: Import supported bank CSV files and convert raw statement data into organized transactions inside MoneyMap.
        - generic [ref=e61]: Use this to start the workflow by bringing your bank data into the app.
        - link "Open Upload" [ref=e62] [cursor=pointer]:
          - /url: /upload
          - text: Open Upload
          - img [ref=e63]
      - generic [ref=e65]:
        - img [ref=e67]
        - heading "View Transactions" [level=3] [ref=e70]
        - paragraph [ref=e71]: Review imported records, verify details, search your activity, and keep your financial data clean and usable.
        - generic [ref=e72]: Use this after upload to inspect transactions and manage categories.
        - link "Open Transactions" [ref=e73] [cursor=pointer]:
          - /url: /transactions
          - text: Open Transactions
          - img [ref=e74]
    - generic [ref=e76]:
      - generic [ref=e77]:
        - heading "Core MoneyMap features" [level=2] [ref=e78]
        - paragraph [ref=e79]: These features work together to help you import, organize, and understand your financial data.
      - generic [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: "01"
          - heading "Upload statements" [level=3] [ref=e83]
          - paragraph [ref=e84]: Import supported CSV files so MoneyMap can parse and store your transaction data.
        - generic [ref=e85]:
          - generic [ref=e86]: "02"
          - heading "Review transactions" [level=3] [ref=e87]
          - paragraph [ref=e88]: Check imported records, confirm details, and prepare your data for categories, rules, and budgets.
        - generic [ref=e89]:
          - generic [ref=e90]: "03"
          - heading "Explore insights" [level=3] [ref=e91]
          - paragraph [ref=e92]: Analyze spending categories, merchant trends, and recurring patterns once your transaction history is ready.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('login and logout flow', async ({ page }) => {
  4  |   await page.goto('http://localhost:5173/login');
  5  | 
  6  |   await page.getByPlaceholder(/email/i).fill('hetcanadian@gmail.com');
  7  |   await page.getByPlaceholder(/password/i).fill('83344@Het');
  8  | 
  9  |   await page.getByRole('button', { name: /login/i }).click();
  10 | 
  11 |   await expect(page).toHaveURL(/dashboard|home/);
  12 | 
  13 |   // logout
> 14 |   await page.getByRole('button', { name: /logout/i }).click();
     |                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  15 | 
  16 |   await expect(page).toHaveURL(/login/);
  17 | });
```