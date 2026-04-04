import { Page, Locator, expect } from '@playwright/test';

export class DeliveriesPage {
  readonly page: Page;
  readonly scheduleDeliveryButton: Locator;
  readonly projectNameInput: Locator;
  readonly concreteTypeInput: Locator;
  readonly volumeInput: Locator;
  readonly scheduledTimeInput: Locator;
  readonly driverNameInput: Locator;
  readonly vehicleNumberInput: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly deliveryRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.scheduleDeliveryButton = page.getByRole('button', { name: 'Schedule Delivery' }).or(page.locator('button:has(svg.lucide-plus)'));
    this.projectNameInput = page.getByLabel('Project Name');
    this.concreteTypeInput = page.getByLabel('Concrete Type');
    this.volumeInput = page.getByLabel('Volume (m³)');
    this.scheduledTimeInput = page.getByLabel('Scheduled Time');
    this.driverNameInput = page.getByLabel('Driver Name');
    this.vehicleNumberInput = page.getByLabel('Vehicle Number');
    this.notesInput = page.getByLabel('Notes');
    this.submitButton = page.getByRole('button', { name: 'Schedule', exact: true });
    this.deliveryRows = page.locator('tr');
  }

  async goto() {
    await this.page.goto('/deliveries');
  }

  async openCreateDialog() {
    await this.scheduleDeliveryButton.first().click();
  }

  async fillDeliveryForm(data: {
    projectName: string;
    concreteType: string;
    volume: string;
    scheduledTime: string;
    driverName?: string;
    vehicleNumber?: string;
    notes?: string;
  }) {
    await this.projectNameInput.fill(data.projectName);
    await this.concreteTypeInput.fill(data.concreteType);
    await this.volumeInput.fill(data.volume);
    await this.scheduledTimeInput.fill(data.scheduledTime);
    if (data.driverName) await this.driverNameInput.fill(data.driverName);
    if (data.vehicleNumber) await this.vehicleNumberInput.fill(data.vehicleNumber);
    if (data.notes) await this.notesInput.fill(data.notes);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectDeliveryInList(projectName: string) {
    await expect(this.page.getByText(projectName)).toBeVisible();
  }
}
