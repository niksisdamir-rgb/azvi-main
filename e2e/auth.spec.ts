import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('Authentication Flow', () => {
  test('should show login landing page when unauthenticated', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // First wait for the main title which is always present
    await expect(page.getByText(/AzVirt DMS/i).first()).toBeVisible();
    // Then check for the specific login prompt text
    await expect(page.getByText(/Prijavite se za nastavak/i).first()).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
