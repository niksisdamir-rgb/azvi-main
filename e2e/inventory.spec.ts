import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('Inventory Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should add a new material and verify stock', async ({ page }) => {
    await page.getByText(/Materials|Materijali/i, { exact: false }).first().click();
    await expect(page.getByRole('heading', { name: /Materials|Materijali/i }).first()).toBeVisible({ timeout: 15000 });

    // The text on the button is "Dodaj materijal"
    // We target the main page button
    await page.getByRole('button', { name: 'Dodaj materijal' }).first().click();

    // Fill form
    const materialName = `Test Material ${Date.now()}`;
    await page.getByLabel('Naziv materijala').fill(materialName);
    
    // Category Select
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Cement' }).click();

    await page.getByLabel('Količina').fill('100');
    await page.getByLabel('Jedinica').fill('kg');
    await page.getByLabel('Minimalni nivo zaliha').fill('20');
    await page.getByLabel(/Kritični prag/).fill('5');
    await page.getByLabel('Dobavljač').fill('Test Supplier');
    await page.getByLabel('Jedinična cijena').fill('10');

    // Submit "Dodaj materijal" inside the dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Dodaj materijal', exact: true }).click();

    // Wait for toast
    await expect(page.getByText('Materijal uspješno dodan')).toBeVisible();

    // Verify it appears in the list
    await expect(page.getByText(materialName)).toBeVisible();

    // Check stock explicitly
    await page.getByRole('button', { name: /Provjeri zalihe/ }).click();
    
    // Check if the toast notification indicates a successful or informative stock check
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
  });
});
