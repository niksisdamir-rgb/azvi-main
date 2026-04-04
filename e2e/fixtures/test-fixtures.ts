import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DeliveriesPage } from '../pages/DeliveriesPage';
import { QualityControlPage } from '../pages/QualityControlPage';

type MyFixtures = {
  loginPage: LoginPage;
  deliveriesPage: DeliveriesPage;
  qcPage: QualityControlPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  deliveriesPage: async ({ page }, use) => {
    await use(new DeliveriesPage(page));
  },
  qcPage: async ({ page }, use) => {
    await use(new QualityControlPage(page));
  },
});

export { expect } from '@playwright/test';
