// ==== CONFIG: set these ====
const WORKER_URL = 'https://pageid-proxy.cmakoto26.workers.dev';
const SECRET      = 'colin'; // must match worker.js AUTH_KEY
// ===========================

const $ = (s) => document.querySelector(s);

// Core controls
const file            = $('#file');
const urlCol          = $('#urlCol');
const hitsCol         = $('#hitsCol');
const startBtn        = $('#start');
const statusEl        = $('#status');
const bar             = $('#bar');
const list            = $('#list');
const aggBody         = $('#agg');
const detailBody      = $('#detail');
const copyBtn         = $('#copyList');
const dlBtn           = $('#downloadCSV');
const minHitsInput    = document.getElementById('minHits');

// Single-URL test controls (optional in HTML)
const runSingle       = document.getElementById('runSingle');
const testUrlInput    = document.getElementById('testUrl');
const singleResultBox = document.getElementById('singleResult');

let parsedRows = [];   // raw parsed objects from the sheet (after header detection)
let results    = [];   // [{url, hits, pageId, source, status, ...extra cols}]

/* -----------------------------
   Single-URL inline tester
------------------------------ */
if (runSingle && testUrlInput && singleResultBox) {
  runSingle.addEventListener('click', async () => {
    const url = (testUrlInput.value || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      alert('Enter a valid URL (https://...)');
      return;
    }
    singleResultBox.textContent = 'Running…';
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': SECRET },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      singleResultBox.innerHTML = `
        <div><strong>URL:</strong> <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div>
        <div><strong>pageId:</strong> ${esc(data.pageId || '(not found)')}</div>
        <div><strong>source:</strong> ${esc(data.source || '')}</div>
        <div><strong>status:</strong> ${esc(data.status || '')}</div>`;
    } catch (err) {
      singleResultBox.textContent = 'Error: ' + err.message;
    }
  });
}

/* -----------------------------
   File load + header detection
------------------------------ */
file?.addEventListener('change', async () => {
  const f = file.files[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  const wb  = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const sh  = wb.Sheets[wb.SheetNames[0]];

  // Read as rows to autodetect header row
  const rowsA1 = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
  if (!rowsA1.length) { alert('No rows found.'); return; }

  // Pick header row by where URL-like density is highest in first ~15 rows
  const urlRx = /^https?:\/\//i;
  let bestRow = 0, bestScore = -1;
  for (let r = 0; r < Math.min(rowsA1.length, 15); r++) {
    const row = rowsA1[r] || [];
    const score = row.filter(c => typeof c === 'string' && urlRx.test(c.trim())).length;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }

  // Build objects using detected headers
  const headers = (rowsA1[bestRow] || []).map((h, i) => (String(h || `col_${i}`).trim()));
  const rowsObj = rowsA1.slice(bestRow + 1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });

  // Auto-detect URL column by URLish ratio
  function urlishRatio(h) {
    let m = 0, n = 0;
    for (const row of rowsObj) {
      const v = (row[h] ?? '').toString().trim();
      if (!v) continue;
      m++;
      if (urlRx.test(v)) n++;
    }
    return m ? n / m : 0;
  }
  const headersSorted = [...headers].sort((a,b) => urlishRatio(b) - urlishRatio(a));
  const guessUrlCol   = headersSorted[0];

  // Auto-detect hits col: name contains hits/impressions/failed (else none)
  const guessHitsCol  = headers.find(h => /hits|impressions|failed/i.test(h)) || '';

  // Populate selectors (still user-overridable)
  urlCol.innerHTML  = headers.map(h => `<option ${h===guessUrlCol?'selected':''}>${esc(h)}</option>`).join('');
  hitsCol.innerHTML = `<option value="">(none)</option>` +
                      headers.map(h => `<option ${h===guessHitsCol?'selected':''}>${esc(h)}</option>`).join('');

  parsedRows = rowsObj; // stash
  setStatus('Columns detected. Adjust if needed, then Start.');
  startBtn.disabled = false;
});

/* -----------------------------
   Batch run
------------------------------ */
startBtn?.addEventListener('click', async () => {
  if (!parsedRows.length) { alert('Load a file first.'); return; }

  const urlKey  = urlCol.value;
  const hitsKey = hitsCol.value || null;
  const minHits = Number(minHitsInput?.value || 0);

  const norm = (u) => {
    try { const x = new URL(u); x.hash = ''; return x.toString(); }
    catch { return (u || '').trim(); }
  };

  // Dedupe by URL and sum hits
  const map     = new Map(); // url -> { hits, sampleRow }
  const urlRx   = /^https?:\/\//i;

  for (const r of parsedRows) {
    const raw = (r[urlKey] || '').toString().trim();
    if (!raw || !urlRx.test(raw)) continue;
    const url  = norm(raw);
    const hits = hitsKey ? Number(r[hitsKey] || 0) : 0;
    const prev = map.get(url);
    if (prev) {
      prev.hits += (Number.isFinite(hits) ? hits : 0);
    } else {
      map.set(url, { hits: (Number.isFinite(hits) ? hits : 0), sampleRow: r });
    }
  }

  // Apply hits threshold before calling the Worker
  const itemsAll = [...map.entries()].map(([url, v]) => ({ url, hits: v.hits, sampleRow: v.sampleRow }));
  const items    = itemsAll.filter(it => it.hits >= minHits);

  setStatus(`Ready: ${items.length}/${itemsAll.length} unique URLs at ≥ ${minHits} hits.`);
  if (!items.length) return;

  results = [];
  bar.max  = items.length;
  bar.value= 0;

  for (let i = 0; i < items.length; i++) {
    const { url, hits, sampleRow } = items[i];
    try {
      const res  = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': SECRET },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      // carry through original row extras (e.g., segment columns)
      results.push({
        url, hits,
        pageId: data.pageId || '',
        source: data.source || '',
        status: data.status || (data.pageId ? 'ok' : 'not-found'),
        __row: sampleRow
      });
    } catch (e) {
      results.push({ url, hits, pageId:'', source:'error', status:'error: ' + e.message, __row: sampleRow });
    }
    bar.value = i + 1;
    setStatus(`Processed ${i + 1} / ${items.length}`);
    await sleep(300); // gentle pacing
  }

  render(results);
});

/* -----------------------------
   Rendering
------------------------------ */
function render(res){
  // Aggregate by pageId
  const byId = new Map(); // id -> { hits, count }
  const ids  = new Set();
  for (const r of res) {
    if (!r.pageId) continue;
    ids.add(r.pageId);
    const v = byId.get(r.pageId) || { hits: 0, count: 0 };
    v.hits  += Number(r.hits) || 0;
    v.count += 1;
    byId.set(r.pageId, v);
  }

  // Comma-separated unique pageIds
  list.textContent = [...ids].join(',');

  // Aggregated table (pageId)
  aggBody.innerHTML = [...byId.entries()]
    .sort((a,b) => (b[1].hits||0) - (a[1].hits||0))
    .map(([id, v]) => `<tr><td>${esc(id)}</td><td>${v.hits}</td><td>${v.count}</td></tr>`)
    .join('') || `<tr><td colspan="3">(no pageIds found)</td></tr>`;

  // Detail table sorted by hits desc
  const sorted = [...res].sort((a,b) => (b.hits||0) - (a.hits||0));
  detailBody.innerHTML = sorted.map(r => `
    <tr>
      <td><a href="${esc(r.url)}" target="_blank" rel="noreferrer noopener">${esc(r.url)}</a></td>
      <td>${esc(r.pageId)}</td>
      <td>${Number(r.hits)||0}</td>
      <td>${esc(r.source)}</td>
      <td>${esc(r.status)}</td>
    </tr>`).join('');

  // Optional aggregations: segment, segmentType (if columns exist)
  const segKey  = guessColumnName(['segment', 'Segment', 'SEGMENT']);
  const typeKey = guessColumnName(['segmentType','segment type','Segment Type','type']);
  if (segKey || typeKey) {
    const host = ensureSection('seg-agg-container', 'Aggregated by Segment');
    const host2= ensureSection('segtype-agg-container', 'Aggregated by Segment Type');

    if (segKey)  renderAggTable(host,  aggregateByKey(sorted, segKey),  ['Segment','Total Hits','# URLs']);
    if (typeKey) renderAggTable(host2, aggregateByKey(sorted, typeKey), ['Segment Type','Total Hits','# URLs']);
  }

  // Copy & Download
  copyBtn.disabled = false;
  dlBtn.disabled   = false;

  copyBtn.onclick = () => navigator.clipboard.writeText(list.textContent).then(() => alert('Copied pageId list.'));

  dlBtn.onclick = () => {
    const header = ['url','pageId','hits','source','status'];
    const csv = [header.join(',')]
      .concat(sorted.map(r => header.map(h => csvq(r[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'pageids.csv';
    a.click();
  };

  setStatus(`Done. ${sorted.length} URLs processed.`);
}

/* -----------------------------
   Helpers
------------------------------ */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function setStatus(s){ if (statusEl) statusEl.textContent = s; }
function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function csvq(s){ const t = String(s ?? ''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g,'""') + '"' : t; }

// Find the first column in the original sheet that matches any of the provided names (case-insensitive).
function guessColumnName(candidates){
  if (!parsedRows.length) return null;
  const keys = Object.keys(parsedRows[0] || {});
  for (const c of candidates) {
    const k = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (k) return k;
  }
  return null;
}

// Make or grab a section with a title and table placeholder
function ensureSection(id, titleText){
  let sec = document.getElementById(id);
  if (!sec) {
    sec = document.createElement('section');
    sec.id = id;
    sec.innerHTML = `
      <h3>${esc(titleText)}</h3>
      <table class="seg-table">
        <thead><tr><th></th><th></th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    // insert after the detail table's parent section if possible
    const anchor = detailBody?.closest('section') || document.body;
    anchor.parentNode.insertBefore(sec, anchor.nextSibling);
  }
  return sec;
}

// Aggregate rows by a given key (using the original row’s column), summing hits and counting URLs
function aggregateByKey(rows, key){
  const m = new Map(); // label -> { hits, count }
  for (const r of rows) {
    const label = (r.__row?.[key] || '').toString().trim();
    if (!label) continue;
    const v = m.get(label) || { hits: 0, count: 0 };
    v.hits  += Number(r.hits) || 0;
    v.count += 1;
    m.set(label, v);
  }
  return [...m.entries()].sort((a,b) => (b[1].hits||0) - (a[1].hits||0));
}

// Render an aggregation table into a section
function renderAggTable(section, entries, headers){
  const t = section.querySelector('table');
  const thead = t.querySelector('thead');
  const tbody = t.querySelector('tbody');
  thead.innerHTML = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;

  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="${headers.length}">(none)</td></tr>`;
    return;
  }
  tbody.innerHTML = entries.map(([label, v]) =>
    `<tr><td>${esc(label)}</td><td>${v.hits}</td><td>${v.count}</td></tr>`
  ).join('');
}
