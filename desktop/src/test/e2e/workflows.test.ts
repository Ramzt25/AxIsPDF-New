// E2E tests for complete application workflows
import { test, expect, Page } from '@playwright/test';

test.describe('TeamBeam Construction Platform E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173'); // Vite dev server
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('complete user workflow: login → project selection → document viewing', async () => {
    // Step 1: Login
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    await page.click('[data-testid="dev-admin-login"]');
    
    // Step 2: Verify main interface loads
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-panel"]')).toBeVisible();
    
    // Step 3: Select a project
    await page.click('[data-testid="project-selector"]');
    await page.click('text=Downtown Office Complex');
    
    // Step 4: Navigate to documents
    await page.click('[data-testid="nav-documents"]');
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    
    // Step 5: Verify document list loads
    await expect(page.locator('text=Floor Plans')).toBeVisible();
    await expect(page.locator('text=Structural Plans')).toBeVisible();
  });

  test('collaboration workflow: real-time chat and activity updates', async () => {
    // Login as first user
    await page.click('[data-testid="dev-admin-login"]');
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
    
    // Open chat panel
    await page.click('[data-testid="nav-chat"]');
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // Send a message
    await page.fill('[data-testid="chat-input"]', 'Test collaboration message');
    await page.click('[data-testid="send-message"]');
    
    // Verify message appears
    await expect(page.locator('text=Test collaboration message')).toBeVisible();
    
    // Check activity feed updates
    await page.click('[data-testid="nav-activity"]');
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
  });

  test('document annotation workflow', async () => {
    // Login and navigate to document viewer
    await page.click('[data-testid="dev-admin-login"]');
    await page.click('[data-testid="nav-documents"]');
    
    // Select a document
    await page.click('text=Floor Plans');
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();
    
    // Open stamp toolbox
    await page.click('[data-testid="stamp-tool"]');
    await expect(page.locator('[data-testid="stamp-toolbox"]')).toBeVisible();
    
    // Select a stamp
    await page.click('[data-testid="stamp-approved"]');
    
    // Click on document to place stamp
    await page.click('[data-testid="pdf-canvas"]', { position: { x: 100, y: 100 } });
    
    // Verify stamp was placed
    await expect(page.locator('[data-testid="annotation-approved"]')).toBeVisible();
  });

  test('AI assistant interaction workflow', async () => {
    // Login and open AI assistant
    await page.click('[data-testid="dev-admin-login"]');
    await page.click('[data-testid="ai-assistant"]');
    
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    
    // Ask AI a question
    await page.fill('[data-testid="ai-input"]', 'Analyze the structural plans for potential issues');
    await page.click('[data-testid="ai-send"]');
    
    // Verify AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('text=potential conflicts')).toBeVisible();
  });

  test('theme switching and preferences', async () => {
    // Login
    await page.click('[data-testid="dev-admin-login"]');
    
    // Verify default theme (light)
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Switch to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Switch back to light theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('responsive design on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.click('[data-testid="dev-admin-login"]');
    
    // Verify mobile navigation appears
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-trigger"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Navigate using mobile menu
    await page.click('[data-testid="mobile-nav-documents"]');
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
  });

  test('keyboard navigation and accessibility', async () => {
    // Login
    await page.click('[data-testid="dev-admin-login"]');
    
    // Test keyboard navigation
    await page.keyboard.press('Control+1'); // Dashboard
    await expect(page.locator('[data-testid="dashboard-panel"]')).toBeVisible();
    
    await page.keyboard.press('Control+2'); // Documents
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    
    await page.keyboard.press('Control+3'); // Chat
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus management
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('data persistence and local storage', async () => {
    // Login and change some settings
    await page.click('[data-testid="dev-admin-login"]');
    await page.click('[data-testid="theme-toggle"]'); // Switch to dark
    
    // Select a project
    await page.click('[data-testid="project-selector"]');
    await page.click('text=Downtown Office Complex');
    
    // Reload page
    await page.reload();
    
    // Verify settings persisted
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('text=Downtown Office Complex')).toBeVisible();
  });

  test('error handling and recovery', async () => {
    // Login
    await page.click('[data-testid="dev-admin-login"]');
    
    // Simulate network error by blocking requests
    await page.route('**/api/**', route => route.abort());
    
    // Try to load data that would fail
    await page.click('[data-testid="nav-documents"]');
    
    // Verify error message appears
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Restore network and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    
    // Verify recovery
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
  });

  test('multi-tab collaboration simulation', async () => {
    // Open second tab
    const secondPage = await page.context().newPage();
    await secondPage.goto('http://localhost:5173');
    
    // Login in both tabs
    await page.click('[data-testid="dev-admin-login"]');
    await secondPage.click('[data-testid="dev-user-login"]');
    
    // Send message from first tab
    await page.click('[data-testid="nav-chat"]');
    await page.fill('[data-testid="chat-input"]', 'Message from admin');
    await page.click('[data-testid="send-message"]');
    
    // Verify message appears in second tab
    await secondPage.click('[data-testid="nav-chat"]');
    await expect(secondPage.locator('text=Message from admin')).toBeVisible();
    
    // Send response from second tab
    await secondPage.fill('[data-testid="chat-input"]', 'Response from user');
    await secondPage.click('[data-testid="send-message"]');
    
    // Verify response appears in first tab
    await expect(page.locator('text=Response from user')).toBeVisible();
    
    await secondPage.close();
  });

  test('performance and loading times', async () => {
    const startTime = Date.now();
    
    // Login
    await page.click('[data-testid="dev-admin-login"]');
    
    // Wait for main interface to load
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Verify reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Test navigation performance
    const navStartTime = Date.now();
    await page.click('[data-testid="nav-documents"]');
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    const navTime = Date.now() - navStartTime;
    
    // Navigation should be fast (under 500ms)
    expect(navTime).toBeLessThan(500);
  });
});