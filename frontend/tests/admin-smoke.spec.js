import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Smoke Test', () => {
  test('should login and navigate admin tabs successfully', async ({ page }) => {
    // Navigate to admin to trigger ProtectedRoute redirect
    await page.goto('http://localhost:5173/admin');
    
    // Login
    await page.fill('input[type="email"]', 'admin@localhub.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect back to dashboard
    await expect(page).toHaveURL(/\/admin/);
    
    // Check Dashboard Tab
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
    
    // Check Businesses Tab
    await page.click('button:has-text("Businesses")');
    await expect(page.locator('h1')).toContainText('Manage Spots');

    // Check Moderation Tab
    await page.click('button:has-text("Moderation")');
    await expect(page.locator('h1')).toContainText('Moderation');

    // Check Settings Tab
    await page.click('button:has-text("Settings")');
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Test that Settings persist
    await page.fill('input[name="siteTitle"]', 'LocalHub Tokyo Test');
    await page.click('button:has-text("Save Settings")');
    await expect(page.getByText('Settings saved successfully!')).toBeVisible({ timeout: 5000 });
  });
});
