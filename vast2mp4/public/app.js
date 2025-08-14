// Set this to your backend in production Pages build.
// For local dev when served by the backend itself, '' uses same-origin.
const API_BASE = 'https://vast-backend-fv3l.onrender.com';

const sel = q => document.querySelector(q);
const vastUrl = sel('#vastUrl');
const btnUnwrap = sel('#btnUnwrap');
const btnCsv = sel('#btnExportCsv');
const btnMp4 = sel('#btnDownloadMp4');
const fileSize = sel('#fileSize');
const summary = sel('#vastSummary');
const tbody = sel('#trackerTable tbody');
const video = sel('#preview');
const previewWrap = sel('#previewWrap');

let last = null;

const humanBytes = n => { if(!n||n<=0) return ''; const u=['B','KB','MB','GB']; let i=0,v=n; while(v>=1024&&i<u.length-1){v/=1024;i++;} return v.toFixed(1)+' '+u[i]; };

async function unwrap(url){
  const r = await fetch(`${API_BASE}/api/unwrap`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ url })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function getSize(kind,url){
  const r = await fetch(`${API_BASE}/api/filesize?kind=${kind}&url=${encodeURIComponent(url)}`);
  return r.ok ? r.json() : { bytes:null, method:'unknown' };
}

function updatePreview(m){
  if(!m || !m.mediaSummary || (m.mediaSummary.kind!=='mp4' && m.mediaSummary.kind!=='hls')){
    video.removeAttribute('src'); previewWrap.style.display='none'; return;
  }
  const k = m.mediaSummary.kind;
  const src = `${API_BASE}/api/download-mp4?kind=${k}&inline=1&url=${encodeURIComponent(m.mediaSummary.url)}`;
  video.src = src; previewWrap.style.display='block'; video.load();
}

function render(man){
  const { placementId, adSystem, click, mediaSummary } = man;
  summary.innerHTML = `
    Placement ID: <b>${placementId ?? 'n/a'}</b> · AdSystem: <b>${adSystem ?? 'n/a'}</b> ·
    ClickThrough: ${click?.through ? `<a target="_blank" href="${click.through}">open</a>` : 'n/a'} ·
    Media: ${mediaSummary.kind==='mp4'
      ? `MP4 ${mediaSummary.width}x${mediaSummary.height}`
      : mediaSummary.kind==='hls' ? 'HLS stream' : 'None'}
  `;

  tbody.innerHTML = '';
  for (const t of man.trackers) {
    const domain = (()=>{ try{ return new URL(t.url).hostname } catch{ return '' } })();
    const tr = document.createElement('tr');

    tr.innerHTML =
      `<td><div class="cell">${t.type}</div></td>` +
      `<td><div class="cell">${t.event||''}</div></td>` +
      `<td><div class="cell">${t.provider}</div></td>` +
      `<td><div class="cell">${domain}</div></td>` +
      `<td class="url"><div class="cell"><div class="bubble"><a target="_blank" href="${t.url}">${t.url}</a></div></div></td>` +
      `<td><button class="expand-btn">Expand</button></td>`;

    // append first so styles apply, then measure
    tbody.appendChild(tr);

    const btn = tr.querySelector('.expand-btn');
    const bubble = tr.querySelector('td.url .bubble');
    const anchor = tr.querySelector('td.url .bubble a');
    if (anchor) anchor.setAttribute('tabindex', '-1');        // avoid focus jump
    bubble.dataset.url = t.url;

    // force layout, then test overflow for expand
    void bubble.offsetHeight;
    const needsExpand = bubble && (bubble.scrollHeight > bubble.clientHeight + 1);
    if (!needsExpand) {
      btn.disabled = true;
    } else {
      btn.disabled = false;
      btn.addEventListener('click', () => {
        const expanded = tr.classList.toggle('expanded');
        btn.textContent = expanded ? 'Collapse' : 'Expand';
      });
    }

    // copy handler (any click inside bubble)
    bubble.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const url = bubble.dataset.url || bubble.textContent.trim();
      const done = () => { bubble.classList.add('copied'); setTimeout(()=>bubble.classList.remove('copied'), 900); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => done());
      } else {
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta); done();
      }
    });
  }

  btnCsv.disabled = false;
  btnMp4.disabled = !(mediaSummary.kind==='mp4' || mediaSummary.kind==='hls');
}



btnUnwrap.addEventListener('click', async ()=>{
  btnUnwrap.disabled = true; btnUnwrap.textContent = 'Unwrapping...';
  fileSize.textContent = ''; last = null; updatePreview(null);
  try{
    const url = vastUrl.value.trim(); if(!url) throw new Error('Enter a VAST URL');
    last = await unwrap(url); render(last); updatePreview(last);

    if (last.mediaSummary.kind === 'mp4'){
      const s = await getSize('mp4', last.mediaSummary.url);
      fileSize.textContent = s.bytes ? `Size: ${humanBytes(s.bytes)}` : '';
    } else if (last.mediaSummary.kind === 'hls'){
      const s = await getSize('hls', last.mediaSummary.url);
      fileSize.textContent = s.bytes ? `Est. size: ${humanBytes(s.bytes)}` : 'Est. size unavailable';
    }
  } catch(e){ alert(e.message || String(e)); }
  finally { btnUnwrap.disabled = false; btnUnwrap.textContent = 'Unwrap'; }
});

btnCsv.addEventListener('click', async ()=>{
  if (!last) return;
  const r = await fetch(`${API_BASE}/api/trackers.csv`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ trackers: last.trackers, click: last.click })
  });
  if (!r.ok) return alert('CSV export failed');
  const blob = await r.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'vast-trackers.csv'; a.click();
  URL.revokeObjectURL(a.href);
});

btnMp4.addEventListener('click', ()=>{
  if (!last) return;
  const kind = last.mediaSummary.kind === 'mp4' ? 'mp4' : 'hls';
  const src  = last.mediaSummary.url;
  window.open(`${API_BASE}/api/download-mp4?kind=${kind}&url=${encodeURIComponent(src)}`,'_blank');
});
