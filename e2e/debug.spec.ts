import { test, expect } from '@playwright/test';

test('debug login', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('trpc')) {
      console.log('API RESPONSE:', response.status(), response.url());
      response.text().then(t => console.log('API BODY:', t)).catch(() => {});
    }
  });

  await page.goto('/login');
  const devBtn = page.getByRole('button', { name: 'Login as Developer' });
  await expect(devBtn).toBeVisible();
  await devBtn.click();
  
  // Wait to see what happens
  await page.waitForTimeout(5000);
});
