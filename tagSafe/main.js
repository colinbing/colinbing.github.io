let creatives = [];
const EXCLUDED_SHEETS_RX = /legacy/i; // ignore sheets like "Legacy Tags"

// ---------- Backend validation API ----------
const TAGSAFE_API_BASE = "https://tagsafe.onrender.com";

async function validateTagOnServer(tagHTML) {
  const res = await fetch(`${TAGSAFE_API_BASE}/api/validate/tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagHTML }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error ${res.status}: ${text}`);
  }

  return res.json();
}

function buildValidationHTML(v) {
  if (!v) {
    return "<em>Validation not run yet.</em>";
  }

  if (v.ok === false && v.error) {
    return `<strong>Validation failed:</strong> ${escapeHTML(v.error)}`;
  }

  let html = `<strong>Tech Validation:</strong><br/>`;
  const status = String(v.status || "unknown").toUpperCase();
  html += `Status: <strong>${escapeHTML(status)}</strong><br/>`;

  if (v.timings && typeof v.timings.adLoadMs === "number") {
    html += `Load: ${Math.round(v.timings.adLoadMs)} ms<br/>`;
  }

  if (v.metrics) {
    if (typeof v.metrics.totalKB === "number") {
      html += `Total weight: ${v.metrics.totalKB.toFixed(1)} KB<br/>`;
    }
    if (typeof v.metrics.requestCount === "number") {
      html += `Requests: ${v.metrics.requestCount}<br/>`;
    }
  }

  if (Array.isArray(v.issues) && v.issues.length) {
    html += "<br/><strong>Issues:</strong><br/><ul>";
    v.issues.forEach(issue => {
      const sev = (issue.severity || "").toUpperCase();
      const code = issue.code || "";
      const msg = issue.message || "";
      html += `<li>[${escapeHTML(sev)}] ${escapeHTML(code)}: ${escapeHTML(msg)}</li>`;
    });
    html += "</ul>";
  } else {
    html += "<br/>No issues detected.";
  }

  if (v.landing && v.landing.primaryUrl) {
    html += `<br/><strong>Landing URL:</strong> ${escapeHTML(v.landing.primaryUrl)}<br/>`;
    if (v.landing.proxyResult && typeof v.landing.proxyResult.status === "number") {
      html += `Landing status: ${v.landing.proxyResult.status}<br/>`;
    }
  }

  return html;
}

async function runValidationForCreative(index) {
  const c = creatives[index];
  const container = document.getElementById(`validation-${index}`);
  if (!c || !container) return;

  // If already validated, just render existing result
  if (c.validation) {
    container.innerHTML = buildValidationHTML(c.validation);
    return;
  }

  container.innerHTML = "<em>Running validation…</em>";

  try {
    const result = await validateTagOnServer(c.tag);
    c.validation = result;
    container.innerHTML = buildValidationHTML(result);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const fail = {
      ok: false,
      status: "fail",
      error: msg,
      issues: [
        {
          code: "VALIDATION_REQUEST_FAILED",
          severity: "error",
          message: msg,
        },
      ],
    };
    c.validation = fail;
    container.innerHTML = buildValidationHTML(fail);
  }
}

async function validateAllCreativesSequential() {
  const statusEl = document.getElementById("globalValidationStatus");
  if (!creatives || creatives.length === 0) {
    if (statusEl) statusEl.textContent = "";
    return;
  }

  if (statusEl) {
    statusEl.textContent = `Running validation for ${creatives.length} tag(s)…`;
  }

  // Sequential to avoid hammering the backend / CPU
  for (let i = 0; i < creatives.length; i++) {
    const c = creatives[i];
    if (!c) continue;

    if (statusEl) {
      statusEl.textContent = `Validating ${i + 1} / ${creatives.length}…`;
    }

    try {
      // This will populate creatives[i].validation and update #validation-i
      await runValidationForCreative(i);
    } catch (err) {
      // runValidationForCreative already handles errors into the UI
      console.error("Validation error for creative", i, err);
    }
  }

  if (statusEl) {
    statusEl.textContent = `Validation complete for ${creatives.length} tag(s).`;
  }
}


// ---------- Drag & Drop / File Input wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  const dz = document.getElementById("uploadArea");
  const fi = document.getElementById("fileInput");
  if (dz) {
    ;["dragenter","dragover"].forEach(evt =>
      dz.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); dz.classList.add("dragover"); })
    );
    ;["dragleave","drop"].forEach(evt =>
      dz.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); dz.classList.remove("dragover"); })
    );
    dz.addEventListener("drop", e => {
      const files = e.dataTransfer.files;
      if (files && files.length) handleFiles(files);
    });
  }
  if (fi) {
    fi.addEventListener("change", e => {
      const files = e.target.files;
      if (files && files.length) handleFiles(files);
      // allow re-selecting same file
      e.target.value = "";
    });
  }
});

// Accept FileList and route each to the parser
function handleFiles(fileList) {
  [...fileList].forEach(file => parseSpreadsheetFile(file));
}

// Read a single file with FileReader, use SheetJS to parse -> AOA, then analyzeSpreadsheet(AOA)
function parseSpreadsheetFile(file) {
  const reader = new FileReader();
  const isBinary = /\.(xlsx|xls)$/i.test(file.name);
  const readAs = isBinary ? "readAsArrayBuffer" : "readAsText";

  reader.onload = () => {
    try {
      let wb;
      if (isBinary) {
        wb = XLSX.read(new Uint8Array(reader.result), { type: "array" });
      } else {
        wb = XLSX.read(reader.result, { type: "string" }); // CSV (single sheet)
      }
      processWorkbook(wb);
    } catch (err) {
      console.error("Failed to parse spreadsheet:", err);
      alert("Sorry, we couldn't parse that file. Try a different sheet or format.");
    }
  };

  reader.onerror = (e) => {
    console.error("File read error:", e);
    alert("Error reading file.");
  };

  reader[readAs](file);
}


// ---------- Single tag paste ----------
function analyzeSingleTag() {
  const input = document.getElementById("tagInput").value.trim();
  if (!input) return;
  creatives = [buildCreativeFromTag("Pasted Tag", input)];
  renderCreativeTable(creatives);
}

function clearTagInput() {
  document.getElementById("tagInput").value = "";
  creatives = [];
  document.getElementById("creativeTable").innerHTML = "";
}

// ---------- Spreadsheet -> creatives ----------
function analyzeSpreadsheet(aoa) {
  if (!aoa || !aoa.length) return;

  const headerRowIndex = (typeof findHeaderRow === "function") ? findHeaderRow(aoa) : 0;
  const headers = normalizeHeaders(headerRowIndex >= 0 ? aoa[headerRowIndex] : aoa[0]);
  const rows = aoa.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 1);

  const { nameCol, idCol } = resolveNameAndIdColumns(headers);
  const tagCols = identifyTagColumns(headers); // keep your improved detector

  const out = [];

  rows.forEach((row, idx) => {
    if (!Array.isArray(row)) return;

    // 1) Try NAME column
    let displayName = (nameCol !== -1) ? sanitizeName(row[nameCol]) : null;

    // 2) If missing, try CREATIVE NAME variants already covered by resolver (nameCol would have been set)
    //    If sanitizeName returned null because it looked like "Placement ID: ...", displayName is still null here.

    // 3) Fallback to Placement ID (sanitized, numeric if possible)
    let placementId = (idCol !== -1) ? sanitizePlacementId(row[idCol]) : null;
    if (!displayName) displayName = placementId;

    // 4) Final fallback: first non-empty text cell
    if (!displayName) {
      const firstText = row.find(v => typeof v === "string" && v.trim().length);
      displayName = firstText ? String(firstText).trim() : `Row ${idx + (headerRowIndex >= 0 ? headerRowIndex + 2 : 2)}`;
    }

    // Pick the best tag candidate
    const candidates = tagCols
      .map(i => row[i])
      .filter(v => typeof v === "string" && v.trim().length);

    if (!candidates.length) return;

    const pick = pickBestTag(candidates);
    if (!pick) return;

    const creative = buildCreativeFromTag(displayName, pick);
    creative.placementId = placementId || null; // show in preview details
    out.push(creative);
  });

  creatives = out;
  renderCreativeTable(creatives);
}




function findHeaderRow(aoa) {
  const keys = ["tag", "ins", "pixel", "width", "height", "iframe", "javascript", "gam", "placement", "creative"];
  const maxScan = Math.min(30, aoa.length);
  let bestIdx = -1, bestScore = 0;

  for (let r = 0; r < maxScan; r++) {
    const row = aoa[r] || [];
    const score = row.reduce((acc, cell) => {
      const s = (cell || "").toString().toLowerCase();
      if (!s) return acc;
      // score if row looks like a header row
      return acc + keys.some(k => s.includes(k)) + (/<ins|<script|<iframe/i.test(s) ? -3 : 0);
    }, 0);
    if (score > bestScore) { bestScore = score; bestIdx = r; }
  }
  return bestIdx; // -1 means we’ll fall back to row 0
}



// try to find "placement name" or "creative name" column
function identifyNameColumn(headerRow) {
  const idx = headerRow.findIndex(h => /placement|creative.*name/i.test(h || ""));
  return idx !== -1 ? idx : 0;
}

function identifyTagColumns(headerRow) {
  const H = headerRow.map(h => (h || "").toString().toLowerCase());
  const likely = [
    "tag", "javascript", "js tag", "iframe", "html", "ins",
    "pixel", "vast", "prefetch", "3rd", "third", "redirect", "url"
  ];
  const rx = /(tag|javascript|iframe|html|ins|pixel|vast|redirect|url)/i;

  const idxs = [];
  H.forEach((h, i) => {
    if (!h) return;
    if (likely.some(k => h.includes(k)) || rx.test(h)) idxs.push(i);
  });

  return idxs.length ? idxs : headerRow.map((_, i) => i);
}



function pickBestTag(list) {
  // order: JS tag, iframe, image/pixel, otherwise the first URL-looking thing
  const js = list.find(t => /<script/i.test(t) || /\.js\b/i.test(t));
  if (js) return js;
  const ifr = list.find(t => /<iframe/i.test(t));
  if (ifr) return ifr;
  const img = list.find(t => /<img/i.test(t));
  if (img) return img;
  const urlish = list.find(t => /^https?:\/\//i.test(t));
  if (urlish) return urlish;
  return list[0];
}

// ---------- Creative analysis ----------
function buildCreativeFromTag(name, tag) {
  let dims = getDimensions(tag);
  if (dims === "Unknown" && isTrackerURL(tag)) dims = "1x1";

  return {
    creativeName: name,
    tag: tag,
    type: detectType(tag),
    dimensions: dims,
    httpsSafe: isHTTPS(tag),
    isValid: isWellFormed(tag),
    vendor: detectVendor(tag)
  };
}


// IMPORTANT: now also parses inline style width/height like width:300px;height:600px
function getDimensions(tag) {
  const lower = tag.toLowerCase();

  // 0) Quick tracker heuristic (for URL-only pixels)
  const looksLikeTrackerURL =
    /^https?:\/\//i.test(tag) && /(trackimp|trackpixel|pixel|imp|beacon|1x1)/i.test(lower);

  // 1) <img> tag with explicit size
  if (/<img/i.test(tag)) {
    const attrW = /width=["']?\s*(\d{1,4})["']/i.exec(tag);
    const attrH = /height=["']?\s*(\d{1,4})["']/i.exec(tag);
    const style = /style=["'][^"']*["']/i.exec(tag);
    if (attrW && attrH) return `${attrW[1]}x${attrH[1]}`;
    if (style) {
      const w = /width:\s*(\d{1,4})\s*px/i.exec(style[0]);
      const h = /height:\s*(\d{1,4})\s*px/i.exec(style[0]);
      if (w && h) return `${w[1]}x${h[1]}`;
      // If explicitly 1px via style, call it 1x1
      if (/width:\s*1\s*px/i.test(style[0]) && /height:\s*1\s*px/i.test(style[0])) return "1x1";
    }
  }

  // 2) width/height attributes (non-img, e.g., iframe/script with attrs)
  const widthAttr = /width=["']?(\d{1,4})["']/i.exec(tag);
  const heightAttr = /height=["']?(\d{1,4})["']/i.exec(tag);
  if (widthAttr && heightAttr) return `${widthAttr[1]}x${heightAttr[1]}`;

  // 3) inline style width/height
  const style = /style=["'][^"']*["']/i.exec(tag);
  if (style) {
    const w = /width:\s*(\d{1,4})\s*px/i.exec(style[0]);
    const h = /height:\s*(\d{1,4})\s*px/i.exec(style[0]);
    if (w && h) return `${w[1]}x${h[1]}`;
  }

  // 4) query/param patterns in URLs
  //    - sz=WxH (in ? or ; params)
  const sz = /(?:[?&]|;)\s*sz=(\d+x\d+)/i.exec(tag);
  if (sz) return sz[1];

  //    - w= / width= and h= / height=
  const qw = /[?&](?:w|width)=(\d{1,4})\b/i.exec(lower);
  const qh = /[?&](?:h|height)=(\d{1,4})\b/i.exec(lower);
  if (qw && qh) return `${qw[1]}x${qh[1]}`;

  //    - size= / pixel= that look like WxH
  const qsize = /[?&](?:size|pixel)=(\d{1,4})x(\d{1,4})\b/i.exec(lower);
  if (qsize) return `${qsize[1]}x${qsize[2]}`;

  //    - literal 1x1 present in path or params
  if (/([/_=-])1x1([/_?.&-]|$)/i.test(lower)) return "1x1";

  // 5) Fallback: URL looks like a tracker → assume 1x1
  if (looksLikeTrackerURL) return "1x1";

  return "Unknown";
}




function calculatePreviewHeight(dimensions) {
  if (!dimensions || !dimensions.includes("x")) return 180; // slightly higher default
  const [w, h] = dimensions.split("x").map(Number);
  const fudge = 30; // account for borders/misc spacing
  return isNaN(h) ? 180 : Math.min(Math.max(h + fudge, 60), 700);
}


function detectType(tag) {
  if (/<script/i.test(tag)) return "JavaScript Tag";
  if (/<iframe/i.test(tag)) return "iFrame Tag";
  if (/<img/i.test(tag) || /1x1/.test(tag)) return "Tracker Tag";
  return "Unknown";
}

function detectVendor(tag) {
  const vendors = {
    flashtalking: /flashtalking/i,
    sizmek: /sizmek/i,
    doubleclick: /doubleclick|dcmads|googletagservices|googlesyndication/i,
    amazon: /amazon-adsystem|aax\.amazon/i,
    adform: /adform/i,
    dv360: /displayvideo\.google/i,
    mediamath: /mathtag/i
  };
  for (let [name, pattern] of Object.entries(vendors)) {
    if (pattern.test(tag)) return name;
  }
  return "Unknown";
}


function isHTTPS(tag) {
  return tag.toLowerCase().includes("https://");
}

function isWellFormed(tag) {
  try {
    const el = document.createElement("div");
    el.innerHTML = tag;
    return el.children.length > 0;
  } catch {
    return false;
  }
}

function countIssues(c) {
  let count = 0;
  if (!c.httpsSafe) count++;
  if (!c.isValid) count++;
  if (!/\d+x\d+/.test(c.dimensions)) count++;
  return count;
}

// ---------- Rendering ----------
function renderCreativeTable(data) {
  const container = document.getElementById("creativeTable");

  const rows = data.map((c, i) => {
    const issueCount = countIssues(c);
    const statusText = issueCount === 0 ? "Passed" : `${issueCount} issue${issueCount > 1 ? "s" : ""}`;
    const statusClass = issueCount === 0 ? "status-pass" : "status-fail";

    const previewHeight = calculatePreviewHeight(c.dimensions);
    const isTracker = c.type === "Tracker Tag" || c.dimensions === "1x1";

    const nameCell = `
      <td class="col-name" title="${escapeHTML(c.creativeName)}" aria-label="${escapeHTML(c.creativeName)}">
        ${escapeHTML(c.creativeName)}
      </td>`;

    const summaryRow = `
      <tr class="main-row">
        ${nameCell}
        <td class="col-type">${c.type}</td>
        <td class="col-vendor">${c.vendor}</td>
        <td class="col-size"><span class="dim-chip">${c.dimensions}</span></td>
        <td class="col-status ${statusClass}">${statusText}</td>
        <td class="col-action"><button class="action-btn" onclick="togglePreview(${i}, this)">Preview</button></td>
      </tr>`;

        const trackerPreview = `
      <tr id="preview-row-${i}" class="preview-row" style="display:none;">
        <td colspan="6" id="preview-cell-${i}">
          <div class="preview-name"><strong>Creative:</strong> ${escapeHTML(c.creativeName)}</div>
          <div style="margin:10px">
            <em>Tracker (1×1) — no visual preview. Raw tag shown below.</em><br/><br/>
            <strong>Tag Test Results:</strong><br/>
            ✅ <strong>HTTPS:</strong> ${c.httpsSafe ? "Yes" : "No"}<br/>
            ✅ <strong>Valid Syntax:</strong> ${c.isValid ? "Yes" : "No"}<br/>
            ✅ <strong>Dimensions:</strong> ${c.dimensions}<br/>
            ✅ <strong>Vendor:</strong> ${c.vendor}<br/>
            ${c.placementId ? `✅ <strong>Placement ID:</strong> ${escapeHTML(c.placementId)}<br/>` : ""}
            ${c.sourceSheet ? `✅ <strong>Sheet:</strong> ${escapeHTML(c.sourceSheet)}<br/>` : ""}
            <br/>
            <div id="validation-${i}" class="validation-block"><em>Validation not run yet.</em></div>
            <br/>
            <pre id="raw-tag-${i}" style="white-space:pre-wrap; word-break:break-word;">${escapeHTML(c.tag)}</pre>
          </div>
        </td>
      </tr>`;

        const creativePreview = `
      <tr id="preview-row-${i}" class="preview-row" style="display:none;">
        <td colspan="6" id="preview-cell-${i}">
          <iframe id="preview-frame-${i}" style="width:100%; height:${previewHeight}px; border:1px solid #ccc;" sandbox="allow-scripts allow-same-origin"></iframe>
          <div style="margin:10px">
            <div class="preview-name"><strong>Creative:</strong> ${escapeHTML(c.creativeName)}</div>
            <strong>Tag Test Results:</strong><br/>
            ✅ <strong>HTTPS:</strong> ${c.httpsSafe ? "Yes" : "No"}<br/>
            ✅ <strong>Valid Syntax:</strong> ${c.isValid ? "Yes" : "No"}<br/>
            ✅ <strong>Dimensions:</strong> ${c.dimensions}<br/>
            ✅ <strong>Vendor:</strong> ${c.vendor}<br/>
            ${c.placementId ? `✅ <strong>Placement ID:</strong> ${escapeHTML(c.placementId)}<br/>` : ""}
            ${c.sourceSheet ? `✅ <strong>Sheet:</strong> ${escapeHTML(c.sourceSheet)}<br/>` : ""}
            <br/>
            <div id="validation-${i}" class="validation-block"><em>Validation not run yet.</em></div>
            <br/>
            <button onclick="toggleRawTag(${i}, this)">Show Raw Tag</button>
            <pre id="raw-tag-${i}" style="display:none; white-space:pre-wrap; word-break:break-word;">${escapeHTML(c.tag)}</pre>
          </div>
        </td>
      </tr>`;


    return summaryRow + (isTracker ? trackerPreview : creativePreview);
  }).join("");

  container.innerHTML = `
    <table class="tag-table">
      <colgroup>
        <col style="width:58%"><col style="width:10%"><col style="width:10%">
        <col style="width:8%"><col style="width:8%"><col style="width:6%">
      </colgroup>
      <thead>
        <tr>
          <th class="col-name">Creative Name</th>
          <th class="col-type">Type</th>
          <th class="col-vendor">Vendor</th>
          <th class="col-size">Size</th>
          <th class="col-status">Status</th>
          <th class="col-action">Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}




function togglePreview(index, btn) {
  const row = document.getElementById(`preview-row-${index}`);
  const frame = document.getElementById(`preview-frame-${index}`);
  const visible = row.style.display === "table-row";
  row.style.display = visible ? "none" : "table-row";

  // Keep width & placement stable by fixing button width via CSS
  btn.textContent = visible ? "Preview" : "Hide Preview";

  if (!visible) {
    // Just opened
    if (frame) {
      frame.style.height = `${calculatePreviewHeight(creatives[index].dimensions)}px`;
      frame.srcdoc = creatives[index].tag;
    }
    // Trigger backend validation for this creative
    runValidationForCreative(index);
  }
}

function toggleRawTag(index, btn) {
  const pre = document.getElementById(`raw-tag-${index}`);
  const isVisible = pre.style.display === "block";
  pre.style.display = isVisible ? "none" : "block";
  btn.textContent = isVisible ? "Show Raw Tag" : "Hide Raw Tag";
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}


// Given the header array and a row, return { name, placementId }
function resolveNameAndId(headers, row) {
  // Normalize headers
  const H = headers.map(h => (h || "").toString().trim().toLowerCase());

  // Candidate header keys (by priority) for the display name:
  const nameKeys = [
    /placement\s*name/i,
    /creative\s*name/i,
    /line\s*item\s*name/i,           // bonus, in case sheets use this
    /description/i
  ];

  // Candidate header keys for placement ID-ish data:
  const idKeys = [
    /placement\s*id/i,
    /gam.*id/i,
    /dfp.*id/i,
    /dcm.*id/i,
    /adserver.*id/i,
    /\b(id|ids)\b/i
  ];

  // find best name column
  let name = null;
  for (const rk of nameKeys) {
    const idx = H.findIndex(h => rk.test(h));
    if (idx !== -1 && row[idx] != null && String(row[idx]).trim()) {
      name = String(row[idx]).trim();
      break;
    }
  }

  // fallback: if name still empty, try “Placement ID” or closest ID as a label
  let placementId = null;
  for (const rk of idKeys) {
    const idx = H.findIndex(h => rk.test(h));
    if (idx !== -1 && row[idx] != null && String(row[idx]).trim()) {
      placementId = String(row[idx]).trim();
      if (!name) name = placementId; // last resort label
      break;
    }
  }

  // final fallback: first non-empty text cell in the row
  if (!name) {
    const firstText = row.find(v => typeof v === "string" && v.trim().length);
    name = firstText ? String(firstText).trim() : "Unnamed Creative";
  }

  return { name, placementId };
}

// Normalize headers once
function normalizeHeaders(headers) {
  return headers.map(h => (h == null ? "" : String(h).trim()));
}

// Find exact header (case-insensitive)
function findColumnIndexExact(headers, exactList) {
  const H = headers.map(h => h.toLowerCase());
  for (const wanted of exactList.map(s => s.toLowerCase())) {
    const idx = H.indexOf(wanted);
    if (idx !== -1) return idx;
  }
  return -1;
}

// Find by regex list (contains/variant match)
function findColumnIndexRegex(headers, patterns) {
  const H = headers.map(h => h.toLowerCase());
  for (const rx of patterns) {
    const idx = H.findIndex(h => rx.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Extract first plausible numeric ID from a messy cell
function sanitizePlacementId(val) {
  if (val == null) return null;
  const s = String(val);
  const m = s.match(/\b\d{6,}\b/); // prefer long numeric chunks
  return m ? m[0] : (s.trim() || null);
}

// Avoid using noisy "Placement ID: ..." rows as names
function sanitizeName(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (/placement\s*id:/i.test(s)) return null; // force fallback; this is junky for display
  return s || null;
}

function resolveNameAndIdColumns(headers) {
  // — NAME (prefer exact, common variants)
  let nameCol = findColumnIndexExact(headers, [
    "Placement Name",
    "DFP Placement Name",
    "GAM Placement Name"
  ]);
  if (nameCol === -1) {
    nameCol = findColumnIndexExact(headers, [
      "Creative Name",
      "Line Item Name",
      "Name"
    ]);
  }
  if (nameCol === -1) {
    nameCol = findColumnIndexRegex(headers, [
      /placement.*name/i,
      /creative.*name/i,
      /line.*item.*name/i
    ]);
  }

  // — ID (prefer exact, e.g. Rolex file’s "Placement_ID")
  let idCol = findColumnIndexExact(headers, [
    "Placement_ID",
    "Placement ID",
    "DFP Placement ID",
    "GAM Placement ID",
    "GAM ID",
    "DCM Placement ID"
  ]);
  if (idCol === -1) {
    idCol = findColumnIndexRegex(headers, [
      /placement.*id/i,
      /gam.*id/i,
      /dfp.*id/i,
      /\bid\b/i
    ]);
  }

  return { nameCol, idCol };
}

function processWorkbook(workbook) {
  const allCreatives = [];
  const seen = new Set(); // dedupe on exact tag string

  for (const sheetName of workbook.SheetNames) {
    if (EXCLUDED_SHEETS_RX.test(sheetName)) continue; // skip “legacy” sheets

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) || [];
    if (!aoa.length) continue;

    // normalize header row
    aoa[0] = aoa[0].map(h => (h == null ? "" : String(h).trim()));

    const extracted = extractCreativesFromAOA(aoa, sheetName);
    for (const c of extracted) {
      if (!seen.has(c.tag)) {
        seen.add(c.tag);
        allCreatives.push(c);
      }
    }
  }

  creatives = allCreatives;
  renderCreativeTable(creatives);
  // Kick off validation for all creatives (fire-and-forget)
  validateAllCreativesSequential();
}

function extractCreativesFromAOA(aoa, sheetName) {
  const out = [];
  if (!aoa || !aoa.length) return out;

  const headerRowIndex = (typeof findHeaderRow === "function") ? findHeaderRow(aoa) : 0;
  const headers = normalizeHeaders(headerRowIndex >= 0 ? aoa[headerRowIndex] : aoa[0]);
  const rows = aoa.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 1);

  const { nameCol, idCol } = resolveNameAndIdColumns(headers);
  const tagCols = identifyTagColumns(headers);

  rows.forEach((row, idx) => {
    if (!Array.isArray(row)) return;

    let displayName = (nameCol !== -1) ? sanitizeName(row[nameCol]) : null;
    let placementId = (idCol !== -1) ? sanitizePlacementId(row[idCol]) : null;
    if (!displayName) displayName = placementId;
    if (!displayName) {
      const firstText = row.find(v => typeof v === "string" && v.trim().length);
      displayName = firstText ? String(firstText).trim() :
        `Row ${idx + (headerRowIndex >= 0 ? headerRowIndex + 2 : 2)}`;
    }

    const candidates = tagCols.map(i => row[i]).filter(v => typeof v === "string" && v.trim().length);
    if (!candidates.length) return;

    const pick = pickBestTag(candidates);
    if (!pick) return;

    // Build creative
    const creative = buildCreativeFromTag(displayName, pick);
    creative.placementId = placementId || null;
    creative.sourceSheet = sheetName;

    // Dimension hint from sheet
    const dimHint = resolveDimensionFromSheet(headers, row);

    // If tag-derived dimensions were unknown, prefer the sheet hint
    if (creative.dimensions === "Unknown" && dimHint) {
      creative.dimensions = dimHint;
    }

    // If still unknown and URL looks like a tracker → assume 1x1
    if (creative.dimensions === "Unknown" && isTrackerURL(pick)) {
      creative.dimensions = "1x1";
      // Optional: also mark type as tracker if not already
      if (creative.type === "Unknown") creative.type = "Tracker Tag";
    }

    out.push(creative);
  });

  return out;
}

// Heuristic: URL looks like a tracker/pixel
function isTrackerURL(tag) {
  const lower = String(tag || "").toLowerCase();
  return (
    /^https?:\/\//.test(lower) &&
    /(trackimp|trackpixel|pixel|imp|beacon|1x1|impression)/.test(lower)
  );
}

// Normalize "WxH" strings like "300x250", "300 x 250", "300X250"
function normalizeDimString(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/(\d{1,4})\s*[xX]\s*(\d{1,4})/);
  if (m) return `${m[1]}x${m[2]}`;
  return null;
}

// Try to pull size from spreadsheet columns
function resolveDimensionFromSheet(headers, row) {
  // normalize headers
  const H = headers.map(h => (h || "").toString().trim().toLowerCase());

  // 1) Single "Dimensions"/"Size"/"Ad Size" style column containing "WxH"
  const singleKeys = [/^dimensions$/, /^size$/, /^ad\s*size$/, /^creative\s*size$/];
  for (const rx of singleKeys) {
    const idx = H.findIndex(h => rx.test(h));
    if (idx !== -1) {
      const dim = normalizeDimString(row[idx]);
      if (dim) return dim;
    }
  }

  // 2) Separate width & height columns
  const wIdx = H.findIndex(h => /^(?:w|width)$/.test(h));
  const hIdx = H.findIndex(h => /^(?:h|height)$/.test(h));
  if (wIdx !== -1 && hIdx !== -1) {
    const w = row[wIdx], h = row[hIdx];
    if (Number(w) > 0 && Number(h) > 0) return `${Number(w)}x${Number(h)}`;
  }

  // 3) Sometimes columns say "Ad Width"/"Ad Height"
  const awIdx = H.findIndex(h => /ad.*width/.test(h));
  const ahIdx = H.findIndex(h => /ad.*height/.test(h));
  if (awIdx !== -1 && ahIdx !== -1) {
    const w = row[awIdx], h = row[ahIdx];
    if (Number(w) > 0 && Number(h) > 0) return `${Number(w)}x${Number(h)}`;
  }

  return null;
}
