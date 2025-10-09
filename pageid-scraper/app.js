// ==== CONFIG ====
const SECRET = 'colin';
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
const copyBtn      = $('#copyIDs');
const sortSel      = $('#sortBy');

/* Totals / impact */
const totalsBox  = $('#totals');
const totalUrls  = $('#totalUrls');
const totalHits  = $('#totalHits');
const willUrls   = $('#willUrls');
const willHits   = $('#willHits');
const willPct    = $('#willPct');

/* Single URL */
const testUrlInput    = $('#testUrl');
const workerUrlSingle = $('#workerUrlSingle');
const runSingle       = $('#runSingle');
const singleResultBox = $('#singleResult');

/* State */
let parsedRows = [];
let headers    = [];
let results    = [];
let isRunning  = false;
let sortMode   = 'hits';
let canonMap   = new Map(); // canonical URL -> aggregated hits

startBtn.disabled = true;
if (runSingle) runSingle.disabled = true;

/* Init */
setStatus('Load a file to begin.');
initTheme();
initTabs();
initDnD();
sortSel?.addEventListener('change', () => { sortMode = sortSel.value; renderTable(results); });

/* -------- Theme -------- */
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

/* -------- Tabs -------- */
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

/* -------- File DnD -------- */
function initDnD(){
  hitsCol.addEventListener('change', () => { buildCanonMap(); updateImpact(); });
  urlCol.addEventListener('change',  () => { buildCanonMap(); updateImpact(); });
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

  // clamp min hits live
  minHitsInp.addEventListener('input', () => {
    const v = Number(minHitsInp.value);
    if (!Number.isFinite(v) || v < 100) minHitsInp.value = '100';
    updateImpact();
  });
}

/* -------- Parse + header detect -------- */
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

  // Rebuild canonical map for totals
  buildCanonMap();

  // Show totals + impact
  totalsBox.hidden = false;
  updateImpact();

  // Reset UI bits
  setStatus('Columns detected. Adjust if needed, then hold to Start.');
  dlBtn.disabled = true;
  copyBtn.disabled = true;
  detailBody.innerHTML = '';
  bar.value = 0;

  startBtn.disabled = false;
  if (runSingle) runSingle.disabled = false;
}

/* -------- Canonicalization / filters -------- */
function buildCanonMap(){
  const urlKey  = urlCol.value;
  const hitsKey = hitsCol.value || null;
  const urlRx = /^https?:\/\//i;

  canonMap = new Map();

  for (const r of parsedRows) {
    const raw = (r[urlKey] || '').toString().trim();
    if (!raw || !urlRx.test(raw)) continue;

    const canon = canonicalizeClient(raw);
    if (!canon) continue;
    if (isWaPoGames(canon)) continue;

    const hits = hitsKey ? Number(r[hitsKey] || 0) : 0;
    canonMap.set(canon, (canonMap.get(canon) || 0) + (Number.isFinite(hits) ? hits : 0));
  }

  // totals
  let tHits = 0;
  for (const v of canonMap.values()) tHits += (Number(v)||0);
  totalUrls.textContent = String(canonMap.size);
  totalHits.textContent = String(tHits);
}

function updateImpact(){
  const minHits = Number(minHitsInp.value || 100);
  let n=0, h=0, totalH=0;
  for (const v of canonMap.values()) totalH += (Number(v)||0);
  for (const [url, hits] of canonMap.entries()) {
    if ((Number(hits)||0) >= minHits) { n++; h += (Number(hits)||0); }
  }
  willUrls.textContent = String(n);
  willHits.textContent = String(h);
  willPct.textContent  = totalH ? Math.round((h/totalH)*100) : 0;
}

/* ======== Hold-to-start STATE MACHINE ======== */
let holdProgress = 0;       // 0..1
let holding = false;
let rafId = null;
const HOLD_MS = 2000;       // 2s to start
const DECAY_MS = 1000;      // ~1s to unwind

// Unified label/class manager
function setBtnState(state, label){
  // state: 'idle' | 'holding' | 'processing' | 'completed'
  startBtn.dataset.state = state;
  startBtn.querySelector('.label').textContent = label;
  startBtn.classList.toggle('running',    state === 'processing');
  startBtn.classList.toggle('processing', state === 'processing');
  startBtn.classList.toggle('completed',  state === 'completed');
  startBtn.classList.toggle('full',       state === 'processing' || state === 'completed');
}

function resetHoldButton(){
  isRunning = false;
  cancelAnimationFrame(rafId);
  holdProgress = 0;
  loop._fired = false;
  startBtn.style.setProperty('--p', '0');
  startBtn.disabled = false;
  startBtn.classList.remove('running','processing','completed','full');
  setBtnState('idle','Hold to Start');
}

startBtn.addEventListener('pointerdown', (e) => {
  if (startBtn.disabled || isRunning) return;
  startBtn.setPointerCapture(e.pointerId);
  holding = true;
  loop._last = performance.now();
  rafId = requestAnimationFrame(loop);
});

startBtn.addEventListener('pointerup', (e) => {
  if (!holding) return;
  holding = false;
  startBtn.releasePointerCapture(e.pointerId);
});

startBtn.addEventListener('pointercancel', () => { holding = false; });

function loop(now){
  if (isRunning) return;  // stop anim once processing
  rafId = requestAnimationFrame(loop);

  const last = loop._last || now;
  const elapsed = now - last;
  loop._last = now;

  // UI state while holding / idle
  setBtnState(holding ? 'holding' : 'idle',
    holding ? `Keep holding (${Math.ceil(Math.max(0, HOLD_MS * (1 - holdProgress)) / 1000)})` : 'Hold to Start'
  );

  // progress math
  holdProgress += (holding ? 1 : -1) * (elapsed / (holding ? HOLD_MS : DECAY_MS));
  holdProgress = Math.max(0, Math.min(1, holdProgress));
  startBtn.style.setProperty('--p', holdProgress.toFixed(3));

  // fire once when fully held
  if (holdProgress >= 1 && !loop._fired) {
    loop._fired = true;
    cancelAnimationFrame(rafId);
    tryStart();   // async; validates before locking into Processing
  }
}

/* attempt to start; validate first, then lock into Processing */
async function tryStart(){
  // sanity checks
  if (!canonMap.size) { alert('Load a file and select columns first.'); return resetHoldButton(); }
  if (!urlCol.value)  { alert('Choose the URL column.'); return resetHoldButton(); }
  const workerURL = (workerUrlInp.value || '').trim();
  if (!workerURL)     { alert('Enter your Worker URL.'); return resetHoldButton(); }

  // build items list based on current minHits
  const minHits = Number(minHitsInp.value || 100);
  const items = [...canonMap.entries()].map(([url,hits]) => ({url,hits})).filter(it => it.hits >= minHits);

  // Lock UI and enter Processing ONLY AFTER validation passes
  isRunning = true;
  startBtn.disabled = true;
  setBtnState('processing','Processing…');
  startBtn.classList.add('running','full');
  loadingEl.hidden = false;

  results = [];
  bar.max   = items.length;
  bar.value = 0;
  setStatus(`Ready: ${items.length} URLs at ≥ ${minHits} hits.`);

  try {
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
          status: data.status || (data.pageId ? 'ok' : 'not-found')
        });
      } catch (e) {
        results.push({ url, hits, pageId:'', source:'error', status:'error: ' + e.message });
      }
      bar.value = i + 1;
      setStatus(`Processed ${i + 1} / ${items.length}`);
      await sleep(300);
    }

    renderTable(results);
    setBtnState('completed','Processing Completed'); // final state (disabled)
  } catch (err) {
    alert('Run failed: ' + (err?.message || err));
    resetHoldButton(); // fall back to idle so they can try again
  } finally {
    isRunning = false;
    loadingEl.hidden  = true;
  }
}

/* -------- Rendering + actions -------- */
function renderTable(res){
  let sorted = [...res];
  if (sortMode === 'hits') sorted.sort((a,b)=> (b.hits||0)-(a.hits||0));
  else sorted.sort((a,b)=> String(a.url).localeCompare(String(b.url)));

  detailBody.innerHTML = sorted.map(r => `
    <tr>
      <td style="word-break:break-word"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></td>
      <td>${esc(r.pageId)}</td>
      <td style="text-align:right">${Number(r.hits)||0}</td>
      <td>${esc(r.source)}</td>
    </tr>`).join('') || `<tr><td colspan="4">(no results)</td></tr>`;

  // Copy unique pageIDs
  copyBtn.disabled = sorted.every(r => !r.pageId);
  copyBtn.onclick = async () => {
    const ids = [...new Set(sorted.map(r => r.pageId).filter(Boolean))];
    await navigator.clipboard.writeText(ids.join(','));
    alert(`Copied ${ids.length} pageIDs.`);
  };

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

/* -------- Single URL -------- */
runSingle?.addEventListener('click', async () => {
  const url = (testUrlInput.value || '').trim();
  const workerURL = (workerUrlSingle.value || '').trim();
  if (!/^https?:\/\//i.test(url)) { alert('Enter a valid URL.'); return; }
  if (!workerURL) { alert('Enter your Worker URL.'); return; }

  const canon = canonicalizeClient(url);
  if (!canon || isWaPoGames(canon)) {
    singleResultBox.textContent = 'Skipped (games/not supported).';
    return;
  }

  singleResultBox.textContent = 'Running…';
  try {
    const res = await fetch(workerURL, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'x-api-key': SECRET },
      body: JSON.stringify({ url: canon })
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

/* -------- Helpers -------- */
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

function isWaPoGames(u){
  try{
    const x = new URL(u);
    if (x.hostname === 'games.washingtonpost.com') return true;
    if (x.hostname.endsWith('washingtonpost.com') && x.pathname.startsWith('/games/')) return true;
    return false;
  } catch { return false; }
}

function canonicalizeClient(raw){
  try {
    const u = new URL(raw);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();

    // WaPo articles: drop all params (newsletter/social tracking)
    if (u.hostname.endsWith('washingtonpost.com')) {
      u.search = '';
    } else {
      const strip = /^(utm_|gclid|fbclid|icid|cmpid|WT\.|mc_|carta-url)$/i;
      const keep = new URLSearchParams();
      for (const [k, v] of u.searchParams.entries()) {
        if (!strip.test(k)) keep.append(k, v);
      }
      u.search = keep.toString();
    }

    if (u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return (raw || '').trim();
  }
}
