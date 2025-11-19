// server/validateTag.js
const path = require("path");
const { chromium } = require("playwright");
const { traceRedirects } = require("./proxyUtils");

// Simple spec thresholds (tune later)
const SPEC = {
  maxTotalKB: 1500,   // total weight limit
  maxRequests: 50,    // total HTTP(S) requests
  maxLoadMs: 1500     // ad load time threshold
};

// Very simple static click URL extractor
function extractClickUrls(tagHTML) {
  const urls = new Set();

  // 1) href="https://..." or href='https://...'
  const hrefDouble = /href\s*=\s*"(\s*https?:\/\/[^"]+)"/gi;
  const hrefSingle = /href\s*=\s*'(\s*https?:\/\/[^']+)'/gi;

  let m;
  while ((m = hrefDouble.exec(tagHTML)) !== null) {
    urls.add(m[1].trim());
  }
  while ((m = hrefSingle.exec(tagHTML)) !== null) {
    urls.add(m[1].trim());
  }

  // 2) Fallback: any bare http(s) URL in the tag
  const urlLoose = /(https?:\/\/[^\s"'<>]+)/gi;
  while ((m = urlLoose.exec(tagHTML)) !== null) {
    urls.add(m[1].trim());
  }

  return Array.from(urls);
}

async function validateTag({ tagHTML, timeoutMs = 15000 }) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const harnessPath = path.join(__dirname, "harness", "harness.html");
  const harnessUrl = "file://" + harnessPath;

  const network = [];
  const consoleErrors = [];
  const failedRequests = [];

  // Capture completed network (HTTP/HTTPS only; ignore file:// harness)
  page.on("requestfinished", async (req) => {
    try {
      const url = req.url();
      if (!/^https?:/i.test(url)) return;

      const res = await req.response();
      if (!res) return;

      const status = res.status();
      const headers = res.headers();
      const lengthHeader = headers["content-length"]
        ? Number(headers["content-length"])
        : null;

      network.push({
        url,
        status,
        contentLength: Number.isFinite(lengthHeader) ? lengthHeader : null,
        type: req.resourceType()
      });
    } catch {
      // ignore internal errors
    }
  });

  // Capture outright failed requests
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!/^https?:/i.test(url)) return;
    const failure = req.failure();
    failedRequests.push({
      url,
      error: failure ? failure.errorText : "unknown"
    });
  });

  // Capture console errors inside harness + iframe
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const harnessStart = Date.now();

  try {
    // Load harness shell
    await page.goto(harnessUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs
    });
    const harnessLoadMs = Date.now() - harnessStart;

    // Inject tag HTML into the iframe via postMessage
    const injectStart = Date.now();
    await page.evaluate((tagHTMLInner) => {
      window.postMessage({ type: "INJECT_TAG", tagHTML: tagHTMLInner }, "*");
    }, tagHTML);

    // Let the ad run a bit; prefer networkidle where available
    try {
      await page.waitForLoadState("networkidle", { timeout: 2000 });
    } catch {
      // ignore timeout here; just means network stayed busy
    }
    // small extra padding
    await page.waitForTimeout(250);

    const adLoadMs = Date.now() - injectStart;

    // Screenshot preview
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false
    });

    // ---- Derive metrics ----
    let totalBytes = 0;
    let maxAssetBytes = 0;
    let mixedContentCount = 0;
    const brokenAssets = [];

    for (const r of network) {
      const len = r.contentLength || 0;
      totalBytes += len;
      if (len > maxAssetBytes) maxAssetBytes = len;

      // track mixed http vs https
      if (/^http:\/\//i.test(r.url)) {
        mixedContentCount++;
      }

      // track HTTP error statuses
      if (r.status >= 400) {
        brokenAssets.push({
          url: r.url,
          status: r.status,
          contentLength: r.contentLength,
          type: r.type
        });
      }
    }

    const totalKB = totalBytes / 1024;
    const maxAssetKB = maxAssetBytes / 1024;
    const requestCount = network.length;
    const failedRequestCount = failedRequests.length;

    // ---- Determine base issues ----
    const issues = [];

    // Slow load warning (based on adLoadMs)
    if (adLoadMs > SPEC.maxLoadMs) {
      issues.push({
        code: "SLOW_LOAD",
        severity: "warn",
        message: `Ad load time ${adLoadMs}ms exceeds threshold ${SPEC.maxLoadMs}ms`
      });
    }

    // Heavy overall weight
    if (totalKB > SPEC.maxTotalKB) {
      issues.push({
        code: "HEAVY_TOTAL_WEIGHT",
        severity: "warn",
        message: `Total weight ~${totalKB.toFixed(
          1
        )}KB exceeds ${SPEC.maxTotalKB}KB`
      });
    }

    // Too many requests
    if (requestCount > SPEC.maxRequests) {
      issues.push({
        code: "TOO_MANY_REQUESTS",
        severity: "warn",
        message: `Total requests ${requestCount} exceeds ${SPEC.maxRequests}`
      });
    }

    // Console errors
    if (consoleErrors.length > 0) {
      issues.push({
        code: "CONSOLE_ERRORS",
        severity: "error",
        message: `Ad produced ${consoleErrors.length} console error(s)`
      });
    }

    // Broken assets / failed requests
    if (brokenAssets.length > 0 || failedRequestCount > 0) {
      issues.push({
        code: "BROKEN_ASSETS",
        severity: "error",
        message: `Ad has ${brokenAssets.length} HTTP error response(s) and ${failedRequestCount} failed request(s)`
      });
    }

    // Mixed content
    if (mixedContentCount > 0) {
      issues.push({
        code: "MIXED_CONTENT",
        severity: "warn",
        message: `Ad loads ${mixedContentCount} asset(s) over http://, which may be blocked on secure pages`
      });
    }

    // ---- Landing page check (simple) ----
    const clickUrls = extractClickUrls(tagHTML);
    let landing = null;

    if (clickUrls.length === 0) {
      issues.push({
        code: "CLICK_URL_NOT_DETECTED",
        severity: "warn",
        message: "No obvious click URL detected in tag HTML; verify click tracking manually"
      });
    } else {
      const primaryUrl = clickUrls[0];
      const landingResult = await traceRedirects(primaryUrl, {
        maxRedirects: 10,
        timeoutMs: 10000
      });

      landing = {
        primaryUrl,
        proxyResult: landingResult
      };

      // Flag if landing looks broken
      if (
        !landingResult.ok ||
        landingResult.status >= 400 ||
        landingResult.error === "TOO_MANY_REDIRECTS" ||
        landingResult.error === "NETWORK_ERROR"
      ) {
        issues.push({
          code: "LANDING_PAGE_ERROR",
          severity: "error",
          message: `Landing page check failed for ${primaryUrl} (status ${landingResult.status || "n/a"})`
        });
      }
    }

    // Overall status
    let status = "pass";
    if (issues.some((i) => i.severity === "error")) {
      status = "fail";
    } else if (issues.length > 0) {
      status = "warn";
    }

    return {
      ok: true,
      status,
      timings: {
        harnessLoadMs,
        adLoadMs
      },
      metrics: {
        totalBytes,
        totalKB,
        requestCount,
        maxAssetBytes,
        maxAssetKB,
        failedRequestCount
      },
      issues,
      landing,
      clickUrls,
      network,
      brokenAssets,
      failedRequests,
      consoleErrors,
      screenshotBase64: screenshot.toString("base64")
    };
  } catch (err) {
    // Catastrophic failure (harness / browser issue)
    return {
      ok: false,
      status: "fail",
      error: err && err.message ? err.message : String(err),
      metrics: null,
      issues: [
        {
          code: "HARNESS_ERROR",
          severity: "error",
          message: "Validation harness failed to run"
        }
      ],
      landing: null,
      clickUrls: [],
      network,
      brokenAssets: [],
      failedRequests,
      consoleErrors
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = { validateTag };
