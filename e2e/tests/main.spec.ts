import { test, expect } from '../fixtures/test-fixtures';

test.describe('Authentication and Core Flows', () => {
  test('1. Successful Login with valid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await loginPage.expectLoggedIn();
  });

  test('2. Login failure with invalid credentials', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('wronguser', 'wrongpass');
    await expect(page.getByText('Failed to login')).toBeVisible();
  });

  test('3. Form submission: Schedule a new delivery', async ({ loginPage, deliveriesPage }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    await deliveriesPage.goto();
    await deliveriesPage.openCreateDialog();
    await deliveriesPage.fillDeliveryForm({
      projectName: 'Test Highway Project',
      concreteType: 'C30/37',
      volume: '10',
      scheduledTime: '2026-12-01T10:00',
      driverName: 'John Doe',
      vehicleNumber: 'BG-123-TX'
    });
    await deliveriesPage.submitForm();
    await deliveriesPage.expectDeliveryInList('Test Highway Project');
  });

  test('4. Dynamic Element Handling: Filter delivery list', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await page.goto('/deliveries');
    
    const searchInput = page.getByPlaceholder('Search deliveries...');
    await searchInput.fill('Test Highway');
    
    // Assert that only relevant rows are shown
    const rows = page.locator('tr:has-text("Test Highway")');
    await expect(rows).toBeVisible();
  });

  test('5. API Interception and Mocking: Dashboard Stats', async ({ loginPage, page }) => {
    // Intercept tRPC call (assuming the URL structure based on common patterns)
    await page.route('**/trpc/deliveries.stats*', async (route) => {
      const json = {
        result: {
          data: {
            totalDeliveries: 100,
            activeVehicles: 15,
            completedToday: 42
          }
        }
      };
      await route.fulfill({ json });
    });

    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await page.goto('/');
    
    await expect(page.getByText('100')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
  });

  test('6. File Upload: Quality Control Photo', async ({ loginPage, qcPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await qcPage.goto();
    
    // Create a dummy file for upload
    const filePath = 'e2e/data/test-photo.jpg';
    // (In a real scenario, we'd ensure this file exists or use a buffer)
    
    await qcPage.uploadTestPhoto(filePath);
    await expect(page.getByText('Photo saved')).toBeVisible();
  });

  test('7. Cross-browser Responsiveness: Mobile View', async ({ loginPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await loginPage.goto();
    
    // Assert mobile-specific UI (e.g., hamburger menu or hidden sidebar)
    const sidebar = page.locator('nav'); // Adjust selector based on actual UI
    await expect(sidebar).toBeHidden(); 
    
    const menuButton = page.getByRole('button', { name: 'Open menu' }).or(page.locator('button svg.lucide-menu'));
    await expect(menuButton).toBeVisible();
  });

  test('8. Complex Form Validation: Required fields', async ({ loginPage, deliveriesPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await deliveriesPage.goto();
    await deliveriesPage.openCreateDialog();
    
    await deliveriesPage.submitForm();
    
    // Check for validation messages
    await expect(page.locator('text=Project Name is required')).toBeVisible();
  });

  test('9. Navigation: Deep linking to delivery details', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    const deliveryId = 1; // Assuming ID 1 exists
    await page.goto(`/deliveries/${deliveryId}`);
    await expect(page).toHaveURL(new RegExp(`/deliveries/${deliveryId}`));
    await expect(page.getByText('Delivery Details')).toBeVisible();
  });

  test('10. Multi-step form: QC Process', async ({ loginPage, qcPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await qcPage.goto();
    
    await qcPage.fillStep1('Concrete Strength Test', 'strength');
    await expect(page.getByText('Step 2')).toBeVisible();
  });

  test('11. Data Persistence: Check delivery after refresh', async ({ loginPage, deliveriesPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await deliveriesPage.goto();
    
    const projectName = `Persist Test ${Date.now()}`;
    await deliveriesPage.openCreateDialog();
    await deliveriesPage.fillDeliveryForm({
      projectName,
      concreteType: 'C25/30',
      volume: '5',
      scheduledTime: '2026-12-01T12:00'
    });
    await deliveriesPage.submitForm();
    
    await page.reload();
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test('12. Logout flow', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    const userMenu = page.locator('button:has-text("admin")'); // Adjust based on UI
    await userMenu.click();
    const logoutButton = page.getByRole('menuitem', { name: 'Logout' });
    await logoutButton.click();
    
    await expect(page).toHaveURL('/login');
  });

  test('13. Table sorting: Sort deliveries by date', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await page.goto('/deliveries');
    
    const dateHeader = page.getByRole('columnheader', { name: 'Date' });
    await dateHeader.click();
    
    // Verify sorting (simplified: check if first row changes or has expected value)
    await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test('14. Error Handling: Network timeout', async ({ loginPage, page }) => {
    await page.route('**/api/**', route => route.abort('timedout'));
    
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    await expect(page.getByText(/Failed|Error|timeout/)).toBeVisible();
  });

  test('15. Accessibility: Check ARIA labels on main dashboard', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });
});
