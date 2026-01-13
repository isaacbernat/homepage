const { test, expect } = require('@playwright/test');

test.describe('Atomic Theme Toggling', () => {
  test('Cycle themes (Light -> Dark -> Light) while Offline', async ({
    page,
    context,
  }) => {
    // Regex matches 1920 or 3840 for both themes
    const lightRegex = /keyboard-light-(1920|3840)\.webp/;
    const darkRegex = /keyboard-dark-(1920|3840)\.webp/;

    // 1. Load Page
    await page.goto('/');

    // 2. Wait for INITIAL ASSETS (Both must be in memory before we cut the line)
    // - Light: Loaded to display
    // - Dark: Preloaded in background
    await Promise.all([
      page.waitForResponse(
        (res) => lightRegex.test(res.url()) && res.status() === 200,
      ),
      page.waitForResponse(
        (res) => darkRegex.test(res.url()) && res.status() === 200,
      ),
    ]);

    // 3. GO OFFLINE
    await context.setOffline(true);

    const html = page.locator('html');
    const mainImage = page.locator('.main-image');

    // --- TRANSITION 1: TO DARK ---
    console.log('Toggling to Dark...');
    await page.click('.theme-toggle');

    // Assert CSS
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Assert Image (Must be Blob)
    const darkBlobUrl = await mainImage.getAttribute('src');
    expect(darkBlobUrl).toMatch(/^blob:/);
    await expect(mainImage).toBeVisible();

    // --- TRANSITION 2: BACK TO LIGHT ---
    console.log('Toggling back to Light...');
    await page.click('.theme-toggle');

    // Assert CSS
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Assert Image (Must be Blob)
    const lightBlobUrl = await mainImage.getAttribute('src');
    expect(lightBlobUrl).toMatch(/^blob:/);
    await expect(mainImage).toBeVisible();

    // Verification: The Blobs should be different URLs
    expect(lightBlobUrl).not.toBe(darkBlobUrl);

    // Verification: The image should still have width (not broken)
    const naturalWidth = await mainImage.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });
});

  