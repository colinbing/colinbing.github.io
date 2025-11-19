const express = require("express");
const cors = require("cors");
const { probeUrl } = require("./playwrightClient");
const { validateTag } = require("./validateTag");
const { traceRedirects } = require("./proxyUtils");

const PORT = process.env.PORT || 8787;
const app = express();

// Basic hardening defaults
app.disable("x-powered-by");

// CORS: allow local Vite and same-origin previews
app.use(cors({
  origin: [
    "http://localhost:5173", // Vite default
    "http://127.0.0.1:5173"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Basic body parsing
app.use(express.json({ limit: "1mb" }));

// ---------------- Health check ----------------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tagsafe-server", ts: Date.now() });
});



app.post("/api/proxy/fetch", async (req, res) => {
  const { url, maxRedirects, timeoutMs } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "MISSING_URL" });
  }

  const t0 = Date.now();
  const result = await traceRedirects(url, { maxRedirects, timeoutMs });
  const t1 = Date.now();

  res.json({
    ...result,
    timings: { totalMs: t1 - t0 },
  });
});

// ---------------- Playwright smoke test ----------------
app.post("/api/validate/ping", async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "MISSING_URL" });
  }

  // Very basic URL sanity
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      return res.status(400).json({ error: "INVALID_SCHEME" });
    }
  } catch {
    return res.status(400).json({ error: "INVALID_URL" });
  }

  const result = await probeUrl(url);
  res.json(result);
});

// ---- Tag Validation (core harness) ----
app.post("/api/validate/tag", async (req, res) => {
  const { tagHTML } = req.body || {};
  if (!tagHTML) {
    return res.status(400).json({ error: "MISSING_tagHTML" });
  }

  const result = await validateTag({ tagHTML });
  res.json(result);
});

// ---------------- 404 handler (MUST be last) ----------------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------------- Start server ----------------
app.listen(PORT, () => {
  console.log(`[tagsafe-server] listening on http://localhost:${PORT}`);
});
