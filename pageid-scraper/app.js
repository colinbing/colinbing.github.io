// ==== CONFIG ====
const SECRET = 'colin'; // must match worker AUTH_KEY
// ================

const $ = (s) => document.querySelector(s);

/* Theme */
const themeToggle = $('#themeToggle');

/* Tabs */
const tabSpreadsheet   = $('#tabSpreadsheet');
const tabSingle        = $('#tabSingle');
const panelSpreadsheet = $('#panelSpreadsheet');
const panelSingle      = $('#panelSingle');

/* Spreadsheet controls */
const dropZone     = $('#dropZone');
const browseBtn    = $('#browseBtn');
const file         = $('#file');

const urlCol       = $('#urlCol');
const hitsCol      = $('#hitsCol');
const minHitsInp   = $('#minHits');
const workerUrlInp = $('#workerUrl');

const startBtn     = $('#start');
const loadingEl    = $('#loading');
const statusEl     = $('#status');
const bar          = $('#bar');
const detailBody   = $('#detail');
const dlBtn        = $('#downloadCSV');

/* Single URL */
const testUrlInput    = $('#testUrl');
const workerUrlSingle = $('#workerUrlSingle');
const runSingle       = $('#runSingle');
const singleResultBox = $('#singleResult');

/* State */
let parsedRows = [];
let headers    = [];
let results    = [];

/* Init */
setStatus('Load a file to begin.');
initTheme();
initTabs();
initDnD();

/* ---------------- Theme ---------------- */
function initTheme(){
  const key = 'pageid_theme';
  const saved = localStorage.getItem(key);
  if (saved === 'dark') {
    document.body.setAttribute('data-theme','dark');
    themeToggle.checked = true;
  }
  themeToggle.addEventListener('change', () => {
    const dark = themeToggle.checked;
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(key, dark ? 'dark' : 'light');
  });
}

/* ---------------- Tabs ---------------- */
function initTabs(){
  tabSpreadsheet.addEventListener('click', () => switchTab('spreadsheet'));
  tabSingle.addEventListener('click', () => switchTab('single'));
}
function switchTab(which){
  const s = which === 'spreadsheet';
  tabSpreadsheet.classList.toggle('active', s);
  tabSingle.classList.toggle('active', !s);
  tabSpreadsheet.setAttribute('aria-selected', String(s));
  tabSingle.setAttribute('aria-selected', String(!s));
  panelSpreadsheet.classList.toggle('hidden', !s);
  panelSingle.classList.toggle('hidden', s);
}

/* ----------- Drag & drop / file ---------- */
function initDnD(){
  browseBtn.addEventListener('click', () => file.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    const f = e.dataTransfer.files?.[0]; if (f) await handleFile(f);
  });
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (f) await handleFile(f);
  });
}

/* ----------- Parse & header detection ---------- */
async function handleFile(f){
  const buf = await f.arrayBuffer();
  const wb  = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const sh  = wb.Sheets[wb.SheetNames[0]];
  const rowsA1 = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
  if (!rowsA1.length) { alert('No rows found.'); return; }

  // Header row: densest distinct strings in first 15 rows
  let bestRow = 0, bestScore = -1;
  for (let r = 0; r < Math.min(rowsA1.length, 15); r++) {
    const row = rowsA1[r] || [];
    const score = new Set(row.filter(x => String(x).trim())).size;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }

  headers = (rowsA1[bestRow] || []).map((h, i) => (String(h || `col_${i}`).trim()));
  parsedRows = rowsA1.slice(bestRow + 1).map(r => { const o = {}; headers.forEach((h, i) => { o[h] = r[i]; }); return o; });

  // Guardrailed column choices
  const urlRx = /^https?:\/\//i;

  const urlish = headers.filter(h => {
    let hits=0, tot=0; for (const row of parsedRows){ const v=(row[h]??'').toString().trim(); if(!v)continue; tot++; if(urlRx.test(v)) hits++; }
    const ratio = tot ? hits/tot : 0; return ratio >= 0.5;
  });

  const numericish = headers.filter(h => {
    let tot=0, nums=0; for (const row of parsedRows){ const v=row[h]; if(v===''||v==null)continue; tot++; if(!isNaN(Number(v))) nums++; }
    return tot>0 && nums/tot >= 0.6;
  });

  urlCol.innerHTML = urlish.map(h => {
    const ex = (parsedRows.find(r => (r[h] && urlRx.test(String(r[h])))) || {})[h] || '';
    const sample = String(ex).slice(0, 80);
    return `<option value="${esc(h)}">${esc(h)} — ${esc(sample)}</option>`;
  }).join('') || `<option value="">(none found)</option>`;

  hitsCol.innerHTML = `<option value="">(none)</option>` + numericish.map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join('');

  setStatus('Columns detected. Adjust if needed, then Start.');
  dlBtn.disabled = true;
  detailBody.innerHTML = '';
  bar.value = 0;
}

/* -------------- Run (Spreadsheet) -------------- */
startBtn.addEventListener('click', async () => {
  if (!parsedRows.length) { alert('Load a file first.'); return; }
  if (!urlCol.value)     { alert('Choose the URL column.'); return; }
  const workerURL = (workerUrlInp.value || '').trim();
  if (!workerURL) { alert('Enter your Worker URL.'); return; }

  toggleRunning(true);
  try {
    const urlKey  = urlCol.value;
    const hitsKey = hitsCol.value || null;
    const minHits = Number(minHitsInp?.value || 0);

    const normalize = (u) => { try{ const x=new URL(u); x.hash=''; return x.toString(); } catch{ return (u||'').trim(); } };
    const urlRx = /^https?:\/\//i;

    // Dedupe by URL and sum hits
    const map = new Map();
    for (const r of parsedRows) {
      const raw = (r[urlKey] || '').toString().trim();
      if (!raw || !urlRx.test(raw)) continue;
      const url  = normalize(raw);
      const hits = hitsKey ? Number(r[hitsKey] || 0) : 0;
      map.set(url, (map.get(url) || 0) + (Number.isFinite(hits) ? hits : 0));
    }

    const items = [...map.entries()].map(([url,hits]) => ({url,hits})).filter(it => it.hits >= minHits);

    results = [];
    bar.max   = items.length;
    bar.value = 0;
    setStatus(`Ready: ${items.length} URLs at ≥ ${minHits} hits.`);

    for (let i = 0; i < items.length; i++) {
      const { url, hits } = items[i];
      try {
        const res  = await fetch(workerURL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': SECRET },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        results.push({
          url, hits,
          pageId: data.pageId || '',
          source: data.source || '',
          status: data.status || (data.pageId ? 'ok':'not-found')
        });
      } catch (e) {
        results.push({ url, hits, pageId:'', source:'error', status:'error: ' + e.message });
      }
      bar.value = i + 1;
      setStatus(`Processed ${i + 1} / ${items.length}`);
      await sleep(300);
    }

    renderTable(results);
  } finally {
    toggleRunning(false);
  }
});

function renderTable(res){
  const sorted = [...res].sort((a,b)=> (b.hits||0)-(a.hits||0));
  const rows = sorted.map(r => `
    <tr>
      <td style="word-break:break-word"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></td>
      <td>${esc(r.pageId)}</td>
      <td style="text-align:right">${Number(r.hits)||0}</td>
      <td>${esc(r.source)}</td>
    </tr>`).join('');
  detailBody.innerHTML = rows || `<tr><td colspan="4">(no results)</td></tr>`;

  // Download CSV (dedupe by url+pageId)
  dlBtn.disabled = false;
  dlBtn.onclick = () => {
    const seen = new Set();
    const list = [];
    for (const r of sorted) {
      const key = `${r.url}__${r.pageId || ''}`;
      if (seen.has(key)) continue;
      seen.add(key); list.push(r);
    }
    const header = ['url','pageId','hits','source','status'];
    const csv = [header.join(',')].concat(list.map(r => header.map(h => csvq(r[h])).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pageids.csv';
    a.click();
  };

  setStatus(`Done. ${sorted.length} URLs processed.`);
}

/* -------------- Single URL mode -------------- */
runSingle.addEventListener('click', async () => {
  const url = (testUrlInput.value || '').trim();
  const workerURL = (workerUrlSingle.value || '').trim();
  if (!/^https?:\/\//i.test(url)) { alert('Enter a valid URL.'); return; }
  if (!workerURL) { alert('Enter your Worker URL.'); return; }

  singleResultBox.textContent = 'Running…';
  try {
    const res = await fetch(workerURL, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'x-api-key': SECRET },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    singleResultBox.innerHTML = `
      <div><strong>pageId:</strong> ${esc(data.pageId || '(not found)')}</div>
      <div><strong>source:</strong> ${esc(data.source || '')}</div>
      <div><strong>status:</strong> ${esc(data.status || '')}</div>
    `;
  } catch (e) {
    singleResultBox.textContent = 'Error: ' + e.message;
  }
});

/* -------------- Helpers -------------- */
function toggleRunning(running){
  startBtn.disabled = running;
  loadingEl.hidden  = !running;
  [file, browseBtn, urlCol, hitsCol, minHitsInp, workerUrlInp].forEach(el=>{
    if(!el) return; running ? el.setAttribute('disabled','true') : el.removeAttribute('disabled');
  });
}
function setStatus(s){ if(statusEl) statusEl.textContent = s; }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function csvq(s){ const t=String(s??''); return /[",\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t; }
