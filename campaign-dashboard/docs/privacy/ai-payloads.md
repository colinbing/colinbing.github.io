Data Minimization & AI Payload Policy (One Page)

Scope: Campaign Performance Visualizer (CPV) features that optionally use AI for column classification and fact summarization.

Prime Directive: Data stays local. No raw rows are ever sent to AI. AI is optional.

AI May Receive (only if user opts in):

Column header strings and sheet names (no cell values).

Pre-computed aggregates only (rounded, k-anonymous; no entity names—hashed IDs only).

Minimal run context (locale, app version).

AI Never Receives:

Raw row data, free-text notes, creatives, tags, URLs, emails, names, IDs, or any PII/PHI.

API keys (kept server-side; never in the browser).

Exact entity labels (we use salted hashes).

Minimization & Privacy Controls:

k-Anonymity: We do not send aggregates for cohorts with n < 5 (dropped or merged into “Other”).

Rounding: Metrics rounded (impressions/clicks/conversions to nearest 10; spend to nearest $1).

Hashing: Dimension values replaced with salted SHA‑256 tokens generated locally per dataset.

Time Windows: Start/end dates sent only as ISO dates, never timestamps.

Rate/Scope Limits: Only the specific request payload for the current action; no background syncs.

Local Parsing UX: XLSX parsing and hashing happen locally with a visible loading indicator; nothing is sent during parse.

Transport & Storage:

Requests go through a server proxy over TLS. No third-party calls from the browser.

Default retention: 0 days (ephemeral)—payloads and AI responses are not stored server-side beyond processing. Optional 7-day debug mode is off by default.

Access & Governance:

Opt-in consent per dataset and per feature (two toggles).

In-product Preview payload shows the exact JSON to be sent.

Audit log (local) records: who opted in, when, and which payload type.

Changes to this policy require version bump and changelog in‑app.

Security Baseline:

Secret management server-side; keys rotated; least‑privilege for services.

Input/output schema validation; PII linter on payloads pre-send.

Versioning:

Policy ID: CPV‑DMAP‑1.1 • Effective: 2025‑09‑11 • Replaces: 1.0 (2025‑09‑10)