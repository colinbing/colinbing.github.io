// Minimal, dependency-free frontend that:
// - Parses XLSX/CSV via SheetJS (CDN loaded in index.html)
// - Lets you choose URL and optional hits column
// - Dedupe & sum hits per URL
// - Calls your Cloudflare Worker per URL to evaluate pageId
// - Renders per-URL results, aggregated counts, and a comma-separated list

const $ = (s) => document.querySelector(s);
const file = $('#file');
const urlCol = $('#urlCol');
const hitsCol = $('#hitsCol');
const startBtn = $('#start');
const status = $('#status');
const bar = $('#bar');
const list = $('#list');
const aggBody = $('#agg');
const detailBody = $('#detail');
const copyBtn = $('#copyList');
const dlBtn = $('#downloadCSV');
const workerUrlInput = $('#workerUrl');

let rows = [];
let results = [];

file.addEventListener('change', async () => {
  const f = file.files[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) { alert('No rows found.'); return; }
  const headers = Object.keys(rows[0]);
  urlCol.innerHTML = headers.map(h => `<option>${h}</option>`).join('');
  hitsCol.innerHTML = `<option value="">(none)</option>` + headers.map(h => `<option>${h}</option>`).join('');
  startBtn.disabled = false;
  status.textContent = 'Select URL / hits columns and press Start.';
});

startBtn.addEventListener('click', async () => {
  const WORKER_URL = (workerUrlInput.value || '').trim();
  if (!/^https?:\/\//i.test(WORKER_URL)) {
    alert('Set your Worker URL first.');
    return;
  }
  const urlKey = urlCol.value;
  const hitsKey = hitsCol.value || null;

  // Normalize, dedupe URLs, sum hits
  const norm = (u) => { try { const x = new URL(u); x.hash=''; return x.toString(); } catch { return (u||'').trim(); } };
  const map = new Map();
  for (const r of rows) {
    const raw = (r[urlKey] || '').toString().trim();
    if (!raw) continue;
    const url = norm(raw);
    const hits = hitsKey ? Number(r[hitsKey] || 0) : 0;
    map.set(url, (map.get(url)||0) + (Number.isFinite(hits) ? hits : 0));
  }
  const items = [...map.entries()].map(([url, hits]) => ({ url, hits }));
  if (!items.length) { alert('No valid URLs after parsing.'); return; }

  // Run
  results = [];
  bar.max = items.length; bar.value = 0;
  status.textContent = 'Running...';
  for (let i = 0; i < items.length; i++) {
    const { url, hits } = items[i];
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      results.push({
        url,
        pageId: data.pageId || '',
        source: data.source || '',
        hits,
        status: data.status || (data.pageId ? 'ok' : 'not-found')
      });
    } catch (e) {
      results.push({ url, pageId: '', source: 'error', hits, status: 'error: ' + e.message });
    }
    bar.value = i + 1;
    status.textContent = `Processed ${i + 1} / ${items.length}`;
    await new Promise(r => setTimeout(r, 200)); // light pacing
  }
  render(results);
});

function render(results) {
  // Aggregate by pageId
  const agg = new Map(); // id -> {hits, count}
  const ids = new Set();
  for (const r of results) {
    if (!r.pageId) continue;
    ids.add(r.pageId);
    const v = agg.get(r.pageId) || { hits: 0, count: 0 };
    v.hits += Number(r.hits) || 0;
    v.count += 1;
    agg.set(r.pageId, v);
  }

  // Comma-separated list
  list.textContent = [...ids].join(',');

  // Aggregated table
  aggBody.innerHTML = [...agg.entries()]
    .map(([id, v]) => `<tr><td>${esc(id)}</td><td>${v.hits}</td><td>${v.count}</td></tr>`)
    .join('') || `<tr><td colspan="3">(no pageIds found)</td></tr>`;

  // Detail table
  detailBody.innerHTML = results.map(r => `
    <tr>
      <td><a href="${esc(r.url)}" target="_blank" rel="noreferrer noopener">${esc(r.url)}</a></td>
      <td>${esc(r.pageId)}</td>
      <td>${Number(r.hits)||0}</td>
      <td>${esc(r.source)}</td>
      <td>${esc(r.status)}</td>
    </tr>`).join('');

  copyBtn.disabled = false;
  dlBtn.disabled = false;

  copyBtn.onclick = () => navigator.clipboard.writeText(list.textContent).then(() => alert('Copied pageId list.'));
  dlBtn.onclick = () => {
    const header = ['url','pageId','hits','source','status'];
    const csv = [header.join(',')].concat(results.map(r => header.map(h => csvq(r[h])).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pageids.csv';
    a.click();
  };
}

function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function csvq(s){ const t=String(s??''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g,'""') + '"' : t; }
