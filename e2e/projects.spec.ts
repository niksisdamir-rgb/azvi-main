import { test, expect } from '@playwright/test';
import { login } from './auth-helper';

test.describe('Projects Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects
    await page.getByText(/Projekti|Projects/i, { exact: false }).first().click();
    await expect(page.getByRole('heading', { name: /Projects|Projekti/i }).first()).toBeVisible({ timeout: 15000 });

    // Click New Project
    await page.getByRole('button', { name: 'New Project' }).click();

    // Fill the form
    const projectName = `Test Project ${Date.now()}`;
    await page.getByLabel('Project Name').fill(projectName);
    await page.getByLabel('Description').fill('A test project created by Playwright');
    await page.getByLabel('Location').fill('Test Location');
    
    // Status is a select
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Active' }).click();

    // Submit (using exact matching for dialog button to avoid confusion)
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Create Project', exact: true }).click();

    // Wait for the success toast
    await expect(page.getByText('Project created successfully')).toBeVisible();

    // Verify the project appears in the list
    await expect(page.getByText(projectName)).toBeVisible();
  });
});
