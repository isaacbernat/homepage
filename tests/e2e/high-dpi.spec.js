const { test, expect } = require('@playwright/test');

test.describe('Responsive Asset Delivery', () => {
  // TEST 1: Retina Display (DPR 2.0)
  test.describe('High Density (Retina)', () => {
    test.use({ deviceScaleFactor: 2 });

    test('Fetches ONLY 4K assets', async ({ page }) => {
      const requestedUrls = [];
      page.on('request', (req) => {
        if (req.url().includes('keyboard-')) requestedUrls.push(req.url());
      });

      await page.goto('/');

      // Wait for the 4K image
      await page.waitForResponse(
        (res) =>
          res.url().includes('keyboard-light-3840.webp') &&
          res.status() === 200,
      );

      const requestsString = requestedUrls.join(',');
      expect(requestsString).toContain('keyboard-light-3840.webp');
      expect(requestsString).not.toContain('keyboard-light-1920.webp');
    });
  });

  // TEST 2: Standard Display (DPR 1.0)
  test.describe('Standard Density', () => {
    test.use({ deviceScaleFactor: 1 });

    test('Fetches ONLY 1080p assets', async ({ page }) => {
      const requestedUrls = [];
      page.on('request', (req) => {
        if (req.url().includes('keyboard-')) requestedUrls.push(req.url());
      });

      await page.goto('/');

      // Wait for the 1080p image
      await page.waitForResponse(
        (res) =>
          res.url().includes('keyboard-light-1920.webp') &&
          res.status() === 200,
      );

      const requestsString = requestedUrls.join(',');
      expect(requestsString).toContain('keyboard-light-1920.webp');
      expect(requestsString).not.toContain('keyboard-light-3840.webp');
    });
  });
});
