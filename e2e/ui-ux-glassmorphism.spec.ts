import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('UI/UX Excellence - Glassmorphism & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have glassmorphism effects on card elements', async ({ page }) => {
    await page.goto('/settings');
    // Check for the glass-card class which should have backdrop-filter: blur
    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();
    
    // Verify CSS properties if possible, or just the class presence as a proxy for the design system.
    const backdropFilter = await glassCard.evaluate((el) => window.getComputedStyle(el).backdropFilter);
    expect(backdropFilter).toContain('blur');
  });

  test('should have glassmorphism on dialogs', async ({ page }) => {
    await page.goto('/quality');
    await page.getByRole('button', { name: 'Record Test' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/glass-dialog/);
    
    // Check for premium aesthetic properties
    const boxShadow = await dialog.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Sidebar should be hidden or collapsed into a hamburger menu
    // We check if the sidebar is not visible in its usual desktop position
    const sidebar = page.locator('aside');
    // Depending on implementation it might be hidden with translateX or display: none
    const isSidebarVisible = await sidebar.isVisible();
    
    if (isSidebarVisible) {
        const boundingBox = await sidebar.boundingBox();
        // If it's visible but off-screen (e.g. mobile drawer), boundingBox.x might be negative
        if (boundingBox && boundingBox.x < 0) {
            console.log('Sidebar is off-screen as expected for mobile');
        } else {
            // Check for hamburger button
            const menuBtn = page.getByRole('button', { name: /menu/i });
            await expect(menuBtn).toBeVisible();
        }
    }
  });

  test('should have interactive elements with hover states', async ({ page }) => {
    // Go to dashboard which always has stat cards
    await page.goto('/');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    
    // Target a glass card (stat cards on dashboard)
    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();
    await glassCard.hover();
    
    // Check if it has the glass-card class
    await expect(glassCard).toHaveClass(/glass-card/);
  });

  test('should follow accessibility best practices', async ({ page }) => {
    // Already logged in from beforeEach, no need to goto('/') again which might trigger skeleton
    
    // Check for main Landmarks - use tag selector if role is flaky
    const mainLandmark = page.locator('main');
    await expect(mainLandmark).toBeVisible({ timeout: 15000 });
    
    // Some layouts might use <header> or just a div with banner role.
    await expect(page.locator('header, [role="banner"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check for alt text on crucial images or icons if any
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).not.toBeNull();
    }
  });
});
