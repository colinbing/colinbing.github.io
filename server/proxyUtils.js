// server/proxyUtils.js
const { setTimeout: sleep } = require("timers/promises");

async function traceRedirects(inputUrl, { maxRedirects = 10, timeoutMs = 15000 } = {}) {
  // Basic URL sanity
  let url;
  try {
    url = new URL(inputUrl);
    if (!/^https?:$/.test(url.protocol)) {
      throw new Error("Only http/https URLs are allowed");
    }
  } catch (e) {
    return { error: "INVALID_URL", message: e.message };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const redirects = [];
  let currentUrl = url.toString();
  let method = "HEAD"; // prefer HEAD first

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const res = await fetch(currentUrl, {
        method,
        redirect: "manual",
        headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
        signal: controller.signal
      });

      const status = res.status;
      const location = res.headers.get("location");
      const contentType = res.headers.get("content-type") || null;
      const contentLengthHeader = res.headers.get("content-length");
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;

      // Record this hop
      redirects.push({ url: currentUrl, status, location: location || null });

      // If we got a 405 on HEAD, retry this same URL with GET (once)
      if (method === "HEAD" && status === 405) {
        method = "GET";
        await sleep(50);
        continue; // retry same URL with GET
      }

      // Follow redirect (3xx with Location)
      if (status >= 300 && status < 400 && location) {
        const next = new URL(location, currentUrl).toString();
        currentUrl = next;
        method = "HEAD"; // reset to HEAD for next hop
        continue;
      }

      // Terminal response
      return {
        ok: status >= 200 && status < 400,
        inputUrl,
        finalUrl: currentUrl,
        status,
        contentType,
        contentLength,
        redirects
      };
    }

    return {
      ok: false,
      inputUrl,
      finalUrl: currentUrl,
      status: 599,
      error: "TOO_MANY_REDIRECTS",
      redirects
    };
  } catch (err) {
    return {
      ok: false,
      inputUrl,
      finalUrl: currentUrl,
      status: 598,
      error: "NETWORK_ERROR",
      message: err && err.message ? err.message : String(err),
      redirects
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { traceRedirects };
