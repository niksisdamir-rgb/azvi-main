import { Page, Locator, expect } from '@playwright/test';

export class QualityControlPage {
  readonly page: Page;
  readonly testNameInput: Locator;
  readonly testTypeSelect: Locator;
  readonly resultInput: Locator;
  readonly statusSelect: Locator;
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly photoInput: Locator;
  readonly capturePhotoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.testNameInput = page.getByLabel('Test Name');
    this.testTypeSelect = page.getByLabel('Test Type');
    this.resultInput = page.getByLabel('Result');
    this.statusSelect = page.getByLabel('Status');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.photoInput = page.locator('input[type="file"]');
    this.capturePhotoButton = page.getByRole('button', { name: 'Capture Photo' });
  }

  async goto() {
    await this.page.goto('/quality-control');
  }

  async fillStep1(testName: string, testType: string) {
    await this.testNameInput.fill(testName);
    await this.testTypeSelect.selectOption(testType);
    await this.nextButton.click();
  }

  async uploadTestPhoto(filePath: string) {
    await this.photoInput.setInputFiles(filePath);
  }

  async expectPhotoPreviewVisible() {
    await expect(this.page.locator('img[alt*="Photo"]')).toBeVisible();
  }
}
