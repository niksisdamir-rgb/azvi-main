import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('Glass Dialog Rendering — QualityControl', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('QC record test dialog opens with glass styling', async ({ page }) => {
    await page.goto('/quality');
    await expect(page.getByRole('heading', { level: 1, name: /Quality Control|Kontrola kvaliteta/i }).first()).toBeVisible({ timeout: 15000 });

    // Open the "Record Test" dialog
    await page.getByRole('button', { name: 'Record Test' }).click();

    // Dialog should be visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify dialog has the glass styling class (glass-dialog token via GlassDialogContent)
    const dialogClass = await dialog.getAttribute('class');
    expect(dialogClass).toContain('glass-dialog');

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('Glass Dialog Rendering — Deliveries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('New delivery dialog opens with glass styling', async ({ page }) => {
    await page.goto('/deliveries');
    await expect(page.getByRole('heading', { level: 1, name: /Manager Dashboard|Isporuke|Deliveries/i }).first()).toBeVisible({ timeout: 15000 });

    // Open dialog
    await page.getByRole('button', { name: 'Nova Isporuka' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Check glass-dialog class applied by GlassDialogContent
    const dialogClass = await dialog.getAttribute('class');
    expect(dialogClass).toContain('glass-dialog');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('Glass Dialog Rendering — Documents', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Upload document dialog opens with glass styling', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('heading', { level: 1, name: /Documents|Dokumenti/i }).first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Upload Document' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const dialogClass = await dialog.getAttribute('class');
    expect(dialogClass).toContain('glass-dialog');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('GlassCard Rendering — Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Settings page renders three GlassCard sections', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: /Podešavanja|Settings/i }).first()).toBeVisible({ timeout: 15000 });

    // Three distinct cards sections should be visible
    await expect(page.getByText(/Push Obavještenja/i).first()).toBeVisible();
    await expect(page.getByText(/SMS obavještenja/i).first()).toBeVisible();
    await expect(page.getByText(/Kritični prag zaliha/i).first()).toBeVisible();

    // Verify glass-card class is applied to card elements
    const cards = page.locator('.glass-card');
    await expect(cards).toHaveCount(3);
  });
});
