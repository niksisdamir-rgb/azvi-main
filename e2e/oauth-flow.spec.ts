import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('OAuth & Logic Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from a clean state by clearing cookies if needed
    // In many setups, sessions are shared across tests unless isolation is enforced.
    await page.context().clearCookies();
  });

  test('should show login page when navigating to /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should login successfully with developer bypass', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should persist session after page reload', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login as Developer' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard|Kontrolna tabla/i }).first()).toBeVisible({ timeout: 20000 });

    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.getByRole('heading', { name: /Dashboard|Kontrolna tabla/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should logout correctly and clear session', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login as Developer' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard|Kontrolna tabla/i }).first()).toBeVisible({ timeout: 20000 });

    // Trigger logout - use aria-label which is set to 'Korisnički profil'
    const profileBtn = page.getByLabel(/Korisnički profil|User Profile/i);
    await profileBtn.click();
    await page.getByRole('menuitem', { name: /Logout|Odjavi se/i }).click();

    // After logout, many apps stay on the page but show unauthenticated state
    // Our DashboardLayout shows "Prijavite se za nastavak" on / root
    await expect(page.getByText(/Prijavite se za nastavak/i)).toBeVisible();
    
    // Attempting to go back to home should stay on home but show landing
    await page.goto('/');
    await expect(page.getByText(/Prijavite se za nastavak/i)).toBeVisible();
  });
});
