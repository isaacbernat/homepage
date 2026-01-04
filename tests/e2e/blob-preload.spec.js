const { test, expect } = require('@playwright/test');

test.describe('Blob URL Preloading', () => {
  test('Hero image preloads on CV page and renders from Disk Cache on Home', async ({
    page,
  }) => {
    // 1. Establish CDP Session (Talk directly to Chrome)
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    const requests = [];
    const highResRegex = /keyboard-.*-(1920|3840)\.webp/;

    // 2. Listen for Raw Network Responses
    client.on('Network.responseReceived', ({ response }) => {
      if (highResRegex.test(response.url)) {
        requests.push({
          url: response.url,
          fromDiskCache: response.fromDiskCache, // The magic property
          timestamp: Date.now(),
        });
        console.log(
          `[Net] ${response.url} | Cached: ${response.fromDiskCache}`,
        );
      }
    });

    // 3. Go to CV Page (Expect 2 Network Downloads: Light & Dark)
    // We use a Promise to ensure we catch the response even if it's fast
    const cvLoadPromise = page.waitForResponse(
      (res) => highResRegex.test(res.url()) && res.status() === 200,
    );

    await page.goto('/cv.html');
    await cvLoadPromise;

    // Allow idle callbacks to fire for the opposite theme
    await page.waitForTimeout(1000);

    // CHECKPOINT A: CV Page
    // We expect 2 requests (Light and Dark preloads).
    // They should NOT be from cache (assuming fresh session).
    expect(requests.length).toBe(2);
    expect(requests[0].fromDiskCache).toBe(false);

    // 4. Navigate to Home (Expect 1 Cache Hit)
    await page.click('nav a[href="index.html"]');
    await page.waitForURL('**/index.html');

    // Wait for the re-fetch logic to run
    await page.waitForTimeout(500);

    // CHECKPOINT B: Home Page
    // We expect 2 NEW requests (Total 4).
    // 1. Fetch High-Res Light (to display)
    // 2. Fetch High-Res Dark (to preload for toggle)
    expect(requests.length).toBe(4);

    // Verify PERFORMANCE:
    // Both requests on the Home page must be instant cache hits.
    const homePageRequests = requests.slice(2); // Get the last 2

    homePageRequests.forEach((req) => {
      expect(req.fromDiskCache).toBe(true);
    });

    // 5. Verify Blob Logic (Visual Proof)
    const mainImage = page.locator('.main-image');
    await expect(mainImage).toBeVisible();
    const src = await mainImage.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });
});
