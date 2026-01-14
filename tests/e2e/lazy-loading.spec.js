const { test, expect } = require('@playwright/test');

test.describe('CV Page Lazy Loading', () => {
  test('Presentation images do not load until scrolled into view', async ({
    page,
  }) => {
    // 1. Prepare to track network requests
    // We want to verify that 'video_preview_with_play_button' is NOT fetched immediately.
    let imageRequested = false;

    // This listener fires for every network request the page makes
    page.on('request', (request) => {
      if (request.url().includes('video_preview_with_play_button')) {
        imageRequested = true;
      }
    });

    // 2. Go to the CV page
    await page.goto('/cv.html');

    // 3. Wait a moment to ensure initial assets have loaded
    await page.waitForTimeout(1000);

    // 4. ASSERT: The image should NOT have been requested yet
    // because it is at the bottom of the page and has loading="lazy"
    expect(imageRequested).toBe(false);

    // 5. Scroll the image into view
    // We locate the image and tell Playwright to scroll until it's visible
    const imageLocator = page.locator('.presentation-preview-image').first();
    await imageLocator.scrollIntoViewIfNeeded();

    // 6. Wait for the network request to fire
    // (We give it a generous timeout in case of network lag)
    await page.waitForResponse(
      (response) =>
        response.url().includes('video_preview_with_play_button') &&
        response.status() === 200,
    );

    // 7. ASSERT: Now it should be loaded (implicit by the waitForResponse passing)
    expect(imageRequested).toBe(true);
    expect(await imageLocator.isVisible()).toBe(true);
  });
});
