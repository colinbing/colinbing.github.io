// server/playwrightClient.js
const { chromium } = require("playwright");

/**
 * Open a URL in headless Chromium and return basic info.
 * This is just a smoke test that Playwright works in your environment.
 */
async function probeUrl(url, { timeoutMs = 15000 } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const start = Date.now();
  let statusCode = null;

  // Listen for the main frame response to capture status
  page.on("response", (response) => {
    try {
      const req = response.request();
      if (req && req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        statusCode = response.status();
      }
    } catch {
      // ignore
    }
  });

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    const title = await page.title();
    const end = Date.now();

    return {
      ok: true,
      url,
      statusCode,
      title,
      timings: {
        domContentLoadedMs: end - start,
      },
    };
  } catch (err) {
    return {
      ok: false,
      url,
      error: err && err.message ? err.message : String(err),
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = { probeUrl };
