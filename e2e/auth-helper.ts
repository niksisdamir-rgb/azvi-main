import { expect } from '@playwright/test';

export async function login(page: any) {
  await page.goto('/login');
  
  // Use the dedicated developer bypass button
  const devBtn = page.getByRole('button', { name: 'Login as Developer' });
  await expect(devBtn).toBeVisible();
  await devBtn.click();

  // Should redirect to dashboard
  await expect(page.getByRole('heading', { level: 1, name: /Dashboard|Kontrolna tabla/i }).first()).toBeVisible({ timeout: 25000 });
}
