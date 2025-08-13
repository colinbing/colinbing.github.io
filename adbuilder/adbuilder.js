/* === Adbuilder JS — Sprint 1: per‑size state + per‑size asset panels === */

/* 0) Seed -> appState v2 */
const seed = {
  logoUrl: "/adbuilder/images/washington-gas-logo.png",
  mediaUrl: "/adbuilder/images/washington-gas.png",
  headline: "Energy-saving upgrades are good for any business.",
  description: "Get generous incentives for boiler systems, gas heating equipment and more.",
  ctaText: "Learn More",
  clickthrough: "https://example.com"
};

window.appState = window.appState || {
  global: { ...seed, trackers: { click: "", imps: ["", ""] } },
  creatives: {
    "970x250": { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } },
    "728x90":  { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } },
    "620x250": { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } },
    "300x250": { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } },
    "300x600": { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } },
    "320x50":  { overrides: {}, trackers: { click: "", imps: ["", ""] }, layout: { mediaSide: "right", fontScale: 1, objectFit: "cover", objectPos: "center" }, crop: { x: 0, y: 0, scale: 1 } }
  }
};

window.Adbuilder = window.Adbuilder || {};
const A = window.Adbuilder;

// attach state references
A.state = window.appState;

// utils (move from shims here, then delete shims)
A.utils = {
  sizeDims(size){ const [w,h]=String(size).split('x').map(n=>parseInt(n,10)); return {w,h}; },
  abs(u){ try{ return new URL(u, window.location.origin).href; } catch{ return u; } },
  sanitizeUrl(u){ if(!u) return ''; try{ return new URL(u, window.location.origin).toString(); } catch{ return ''; } },
  substituteDest(tmpl, dest){
    if(!tmpl) return dest||'';
    const enc = encodeURIComponent(dest||'');
    return tmpl.replace(/\{\{DEST\}\}|\{DEST\}|%%DEST_URL%%|%%CLICK_URL_ESC%%/g, enc);
  }
};

A.resolved = window.resolved;
A.renderers = window.layoutRenderers;

/* 1) Resolver helpers */
function resolved(size) {
  const g = appState.global;
  const s = appState.creatives[size] || { overrides: {} };
  return {
    logoUrl:      s.overrides.logoUrl      ?? g.logoUrl,
    mediaUrl:     s.overrides.mediaUrl     ?? g.mediaUrl,
    headline:     s.overrides.headline     ?? g.headline,
    description:  s.overrides.description  ?? g.description,
    ctaText:      s.overrides.ctaText      ?? g.ctaText,
    clickthrough: s.overrides.clickthrough ?? g.clickthrough
  };
}

window.resolved = window.resolved || resolved;


/* 2) Renderers (unchanged API: take assets) */
function render970x250(assets) {
  return `
    <div class="ad-preview ad-970x250" data-size="970x250"
         data-export="creative" data-name="970x250"
         style="width:970px; height:250px;">
      <div class="left-content">
        <img class="logo" src="${assets.logoUrl}" alt="Logo" />
        <h1 class="headline">${assets.headline}</h1>
        <p class="description">${assets.description}</p>
        <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
      </div>
      <div class="right-content">
        <img class="media" src="${assets.mediaUrl}" alt="Media" />
      </div>
    </div>
  `;
}

function render320x50(assets) {
  return `
    <div class="ad-preview ad-320x50" data-size="320x50"
         data-export="creative" data-name="320x50">
      <img class="logo" src="${assets.logoUrl}" alt="Logo" />
      <div class="text-wrapper">
        <div class="headline">${assets.headline}</div>
      </div>
      <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
    </div>
  `;
}

function render728x90(assets) {
  return `
    <div class="ad-preview ad-728x90" data-size="728x90"
         data-export="creative" data-name="728x90">
      <div class="left-column">
        <img class="logo" src="${assets.logoUrl}" alt="Logo" />
      </div>
      <div class="middle-column">
        <div class="headline">${assets.headline}</div>
        <div class="description">${assets.description}</div>
      </div>
      <div class="right-column">
        <img class="media" src="${assets.mediaUrl}" alt="Media" />
      </div>
    </div>
  `;
}

function render620x250(assets) {
  return `
    <div class="ad-preview ad-620x250" data-size="620x250"
         data-export="creative" data-name="620x250">
      <div class="left-content">
        <div class="logo-wrapper">
          <img class="logo" src="${assets.logoUrl}" alt="Logo" />
        </div>
        <div class="headline">${assets.headline}</div>
        <div class="description">${assets.description}</div>
        <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
      </div>
      <div class="right-media">
        <img src="${assets.mediaUrl}" alt="Media" />
      </div>
    </div>
  `;
}

function render300x250(assets) {
  return `
    <div class="ad-preview ad-300x250" data-size="300x250"
         data-export="creative" data-name="300x250">
      <div class="media">
        <img src="${assets.mediaUrl}" alt="Media" />
      </div>
      <div class="text-block">
        <div class="headline">${assets.headline}</div>
        <div class="bottom-row">
          <img class="logo" src="${assets.logoUrl}" alt="Logo" />
          <a class="cta-button" href="${assets.clickthrough}">${assets.ctaText}</a>
        </div>
      </div>
    </div>
  `;
}

function render300x600(assets) {
  return `
    <div class="ad-preview ad-300x600" data-size="300x600"
         data-export="creative" data-name="300x600">
      <div class="logo-row">
        <img class="logo" src="${assets.logoUrl || ''}" alt="Logo" />
      </div>
      <div class="media">
        <img src="${assets.mediaUrl || ''}" alt="Main Visual" />
      </div>
      <div class="text-block">
        <h1 class="headline">${assets.headline || ''}</h1>
        <p class="description">${assets.description || ''}</p>
        <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
      </div>
    </div>
  `;
}

/* 3) Renderer map */
const layoutRenderers = {
  "970x250": render970x250,
  "728x90":  render728x90,
  "620x250": render620x250,
  "300x250": render300x250,
  "300x600": render300x600,
  "320x50":  render320x50
};

window.layoutRenderers = layoutRenderers;


/* 4) Side highlight */
function setHighlight(el) {
  const smiTop = el.offsetTop;
  const contentTop = document.querySelector('.side-menu-content').offsetTop;
  const offsetTop = contentTop + smiTop;
  const height = el.offsetHeight;
  const highlight = document.querySelector('.smi-highlight');
  highlight.style.top = offsetTop + 'px';
  highlight.style.height = height + 'px';
}

/* 5) Layout switcher: previews + per‑size panel; global “Assets” unchanged */
function renderLayout(layoutId) {
  const preview = document.getElementById("creative-preview");
  const panel = document.getElementById("sizePanel");

  if (layoutId === "assets") {
    renderGlobalAssetsForm();
    hideSizePanel();
    panel?.classList.add("hide-tab");   // <--- hide tab for global
    return;
  } else {
    panel?.classList.remove("hide-tab"); // <--- show tab for size views
  }

  const renderer = layoutRenderers[layoutId];
  if (!renderer) return;

  const assets = resolved(layoutId);
  preview.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; height:100%; width:100%;">
      ${renderer(assets)}
    </div>
  `;

  renderSizePanel(layoutId);
}


/* 6) Per‑size form */
function sizeAssetsFormHTML(size){
  const s = appState.creatives[size]; const o = s.overrides; const t = s.trackers;
  return `
    <form id="sizeAssetsForm-${size}" class="global-assets-form" style="padding:8px; box-shadow:none; border:0;">
      <label>Headline
        <input type="text" name="headline" placeholder="Use global if blank" value="${o.headline ?? ""}">
      </label>
      <label>Description
        <input type="text" name="description" placeholder="Use global if blank" value="${o.description ?? ""}">
      </label>
      <label>CTA Text
        <input type="text" name="ctaText" placeholder="Use global if blank" value="${o.ctaText ?? ""}">
      </label>
      <label>Clickthrough URL
        <input type="url" name="clickthrough" placeholder="Use global if blank" value="${o.clickthrough ?? ""}">
      </label>
      <label>Logo Image (override)
        <input type="file" name="logo" accept="image/*">
      </label>
      <label>Media Image/Video (override)
        <input type="file" name="media" accept="image/*,video/*">
      </label>

      <div class="trackers-grid" style="margin-top:8px;">
        <label for="clickTracker-${size}">Click tracker</label>
        <input id="clickTracker-${size}" type="url" value="${t.click ?? ""}" placeholder="https://...">

        <label for="impTracker1-${size}">Impression tracker 1</label>
        <input id="impTracker1-${size}" type="url" value="${t.imps?.[0] ?? ""}" placeholder="https://...">

        <label for="impTracker2-${size}">Impression tracker 2</label>
        <input id="impTracker2-${size}" type="url" value="${t.imps?.[1] ?? ""}" placeholder="https://...">
      </div>

      <div style="display:flex; gap:8px; margin-top:12px;">
        <button type="submit">Save ${size} Overrides</button>
        <button type="button" id="clearOverrides-${size}" style="background:#888;">Clear Overrides</button>
      </div>
    </form>
  `;
}

function renderSizePanel(size){
  // Required DOM nodes
  const panel   = document.getElementById('sizePanel');
  const title   = document.getElementById('sizePanelTitle');
  const content = document.getElementById('sizePanelContent');
  const tab     = document.getElementById('sizePanelTab');
  const close   = document.getElementById('sizePanelClose');
  if(!panel || !title || !content || !tab || !close) return;

  // Title + content
  title.textContent = `Assets: ${size}`;
  content.innerHTML = sizeAssetsFormHTML(size);
  bindSizeAssetsForm(size);

  // Vertical tab label
  tab.textContent = 'Customize assets';

  // Handlers (no toggle-back on tab)
  tab.onclick = (e) => {
    e.stopPropagation();
    if (!panel.classList.contains('open')) openSizePanel();
  };
  close.onclick = (e) => {
    e.stopPropagation();
    hideSizePanel();
  };
}

function openSizePanel(){
  const panel = document.getElementById('sizePanel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
}
function hideSizePanel(){
  const panel = document.getElementById('sizePanel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
}

function bindSizeAssetsForm(size){
  const form = document.getElementById(`sizeAssetsForm-${size}`); const cs = appState.creatives[size];
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form); const o = cs.overrides;

    const headline     = fd.get('headline')?.trim();
    const description  = fd.get('description')?.trim();
    const ctaText      = fd.get('ctaText')?.trim();
    const clickthrough = fd.get('clickthrough')?.trim();
    const logoFile     = fd.get('logo');
    const mediaFile    = fd.get('media');

    headline     ? o.headline     = headline     : delete o.headline;
    description  ? o.description  = description  : delete o.description;
    ctaText      ? o.ctaText      = ctaText      : delete o.ctaText;
    clickthrough ? o.clickthrough = clickthrough : delete o.clickthrough;

    if (logoFile && logoFile.name)  o.logoUrl  = URL.createObjectURL(logoFile); else delete o.logoUrl;
    if (mediaFile && mediaFile.name) o.mediaUrl = URL.createObjectURL(mediaFile); else delete o.mediaUrl;

    cs.trackers.click   = document.getElementById(`clickTracker-${size}`).value.trim();
    cs.trackers.imps[0] = document.getElementById(`impTracker1-${size}`).value.trim();
    cs.trackers.imps[1] = document.getElementById(`impTracker2-${size}`).value.trim();

    renderLayout(size);
    openSizePanel(); // remain open after save
  });

  document.getElementById(`clearOverrides-${size}`).addEventListener('click', ()=>{
    cs.overrides = {};
    renderLayout(size);
    openSizePanel();
  });
}

/* 7) Global assets form -> writes to appState.global */
function renderGlobalAssetsForm() {
  const container = document.getElementById('creative-preview');
  const g = appState.global;
  container.innerHTML = `
    <div class="global-assets-form" style="padding: 20px; max-width: 600px; width: 100%;">
      <h2>Global Creative Assets</h2>
      <form id="globalAssetsForm">
        <label>Headline
          <input type="text" name="headline" placeholder="Enter headline" value="${g.headline || ''}" />
        </label>
        <label>Description
          <input type="text" name="description" placeholder="Enter description" value="${g.description || ''}" />
        </label>
        <label>CTA Text
          <input type="text" name="ctaText" placeholder="Enter CTA" value="${g.ctaText || ''}" />
        </label>
        <label>Clickthrough URL
          <input type="url" name="clickthrough" placeholder="https://example.com" value="${g.clickthrough || ''}" />
        </label>
        <label>Logo Image
          <input type="file" name="logo" accept="image/*" />
        </label>
        <label>Media Image or Video
          <input type="file" name="media" accept="image/*,video/*" />
        </label>
        <details class="trackers">
          <summary>Global Trackers</summary>
          <div class="trackers-grid">
            <label for="gClick">Click tracker</label>
            <input id="gClick" type="url" value="${g.trackers.click}" placeholder="https://...">
            <label for="gImp1">Impression tracker 1</label>
            <input id="gImp1" type="url" value="${g.trackers.imps[0]}" placeholder="https://...">
            <label for="gImp2">Impression tracker 2</label>
            <input id="gImp2" type="url" value="${g.trackers.imps[1]}" placeholder="https://...">
          </div>
        </details>
        <button type="submit">Save Assets</button>
      </form>
    </div>
  `;
  globalFormSubmitHandler();
}

function globalFormSubmitHandler() {
  const form = document.getElementById('globalAssetsForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const fd = new FormData(form);
    const g = appState.global;

    const headline     = fd.get('headline')?.trim();
    const description  = fd.get('description')?.trim();
    const ctaText      = fd.get('ctaText')?.trim();
    const clickthrough = fd.get('clickthrough')?.trim();
    const logoFile     = fd.get('logo');
    const mediaFile    = fd.get('media');

    if (headline)     g.headline     = headline;
    if (description)  g.description  = description;
    if (ctaText)      g.ctaText      = ctaText;
    if (clickthrough) g.clickthrough = clickthrough;
    if (logoFile && logoFile.name)  g.logoUrl  = URL.createObjectURL(logoFile);
    if (mediaFile && mediaFile.name) g.mediaUrl = URL.createObjectURL(mediaFile);

    g.trackers.click   = document.getElementById('gClick').value.trim();
    g.trackers.imps[0] = document.getElementById('gImp1').value.trim();
    g.trackers.imps[1] = document.getElementById('gImp2').value.trim();
  });
}

/* 8) Side menu logic */
document.querySelectorAll('.side-menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.side-menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    setHighlight(item);
    const layoutId = item.getAttribute('data-layout') || item.getAttribute('data-size');
    renderLayout(layoutId);
  });
});

/* 9) Initial render */
const activeItem = document.querySelector('.side-menu-item.active');
const defaultLayout = activeItem.getAttribute('data-layout') || activeItem.getAttribute('data-size');
renderLayout(defaultLayout);
setHighlight(activeItem);

/* ============================================
   REPLACE everything from 
   // === Export Modal: full replacement JS === 
   to the end of the file with THIS BLOCK.
   ============================================ */

/* Ensure renderer map and resolver are global (defined earlier in your file) */
window.layoutRenderers = window.layoutRenderers || layoutRenderers;
window.resolved        = window.resolved || resolved;

/* ---------- Modal open/close (single source of truth) ---------- */
function openExportModal(){
  const modal = document.getElementById('exportModal');
  if (!modal) { console.warn('exportModal not found'); return; }
  renderExportRows(); // populate on open
  modal.classList.add('is-open');
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus();
}
function closeExportModal(){
  const modal = document.getElementById('exportModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  modal.setAttribute('hidden','');
  document.body.style.overflow = '';
}
window.openExportModal  = openExportModal;
window.closeExportModal = closeExportModal;

/* Backdrop + close button + ESC */
document.getElementById('exportModal')?.addEventListener('click', e=>{
  if (e.target === e.currentTarget) closeExportModal();
});
document.getElementById('exportModalClose')?.addEventListener('click', closeExportModal);
document.addEventListener('keydown', e=>{
  if (e.key === 'Escape' && document.getElementById('exportModal')?.classList.contains('is-open')) closeExportModal();
});

/* ---------- Tag builder row rendering (single canonical impl) ---------- */
function renderExportRows(){
  const list = document.getElementById('exportList');
  const fmt  = document.getElementById('exportFormat')?.value || 'js';
  if (!list) return;
  list.innerHTML = '';

  Object.keys(A.state.creatives).forEach(size=>{
    const tag = A.buildTag(size, fmt);

    const row  = document.createElement('div'); row.className='export-row';
    const name = document.createElement('div'); name.className='export-name'; name.textContent=size;
    const pre  = document.createElement('pre'); const code=document.createElement('code'); code.textContent=tag; pre.appendChild(code);

    const actions = document.createElement('div'); actions.className='export-actions';
    const copyBtn = document.createElement('button'); copyBtn.type='button'; copyBtn.textContent='Copy';
    copyBtn.addEventListener('click', ()=>navigator.clipboard.writeText(tag));
    const dlBtn = document.createElement('button'); dlBtn.type='button'; dlBtn.textContent='Download';
    dlBtn.addEventListener('click', ()=>{
      const ext = fmt==='html' ? 'html' : (fmt==='iframe' ? 'html' : 'txt');
      const blob = new Blob([tag], {type:'text/plain;charset=utf-8'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`ad_${size}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    });

    actions.appendChild(copyBtn); actions.appendChild(dlBtn);
    row.appendChild(name); row.appendChild(pre); row.appendChild(actions);
    list.appendChild(row);
  });
}

document.getElementById('exportFormat')?.addEventListener('change', renderExportRows);

/* ---------- Third‑party tag formats (define if missing) ---------- */
if (typeof iframeTag === 'undefined'){
  function iframeTag({w,h,media,clickUrl,pixels}){
    const pxImgs = (pixels||[]).map(u=>`<img src="${u}" width="1" height="1" style="position:absolute;left:-9999px;top:-9999px;border:0;" alt="">`).join('');
    const srcdoc = [
      '<!DOCTYPE html>',
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      `<title>Ad ${w}x${h}</title></head>`,
      `<body style="margin:0;padding:0;">`,
      `<a href="${clickUrl}" target="_blank" rel="noopener">`,
      `  <img src="${media}" width="${w}" height="${h}" style="display:block;border:0;object-fit:cover;" alt="">`,
      `</a>`,
      `${pxImgs}`,
      `</body></html>`
    ].join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    return `<iframe srcdoc="${srcdoc}" width="${w}" height="${h}" frameborder="0" scrolling="no" style="border:0;display:block;"></iframe>`;
  }
}
if (typeof standaloneHTML === 'undefined'){
  function standaloneHTML({w,h,media,clickUrl,pixels}){
    const pxImgs = (pixels||[]).map(u=>`<img src="${u}" width="1" height="1" style="position:absolute;left:-9999px;top:-9999px;border:0;" alt="">`).join('');
    return [
      '<!DOCTYPE html>',
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      `<title>Ad ${w}x${h}</title></head>`,
      `<body style="margin:0;padding:0;">`,
      `<a href="${clickUrl}" target="_blank" rel="noopener">`,
      `  <img src="${media}" width="${w}" height="${h}" style="display:block;border:0;object-fit:cover;" alt="">`,
      `</a>`,
      `${pxImgs}`,
      `</body></html>`
    ].join('\n');
  }
}

// Tag shims
A.tags = {
  jsTag({w,h,media,clickUrl,pixels}){ /* your existing jsTag body */ 
    return [
`<script>(function(){`,
`var W=${w}, H=${h};`,
`var media=${JSON.stringify(media||'')};`,
`var clickUrl=${JSON.stringify(clickUrl||'')};`,
`var pixels=${JSON.stringify((pixels||[]))};`,
`var d=document;`,
`function currentScript(){`,
`  return d.currentScript || (function(a){ a=d.getElementsByTagName('script'); return a[a.length-1]; })();`,
`}`,
`function inject(){`,
`  var s=currentScript();`,
`  var box=d.createElement('div');`,
`  box.style.cssText='width:'+W+'px;height:'+H+'px;display:block;overflow:hidden;border:0;';`,
`  var a=d.createElement('a');`,
`  a.href=clickUrl; a.target='_blank'; a.rel='noopener';`,
`  a.style.cssText='display:block;width:100%;height:100%;position:relative;';`,
`  var img=d.createElement('img');`,
`  img.src=media; img.alt=''; img.width=W; img.height=H;`,
`  img.style.cssText='width:100%;height:100%;object-fit:cover;display:block;border:0;';`,
`  a.appendChild(img); box.appendChild(a);`,
`  s.parentNode.insertBefore(box, s.nextSibling);`,
`  try{ if(Array.isArray(pixels)) pixels.forEach(function(u){ if(u){ var p=new Image(); p.src=String(u); } }); }catch(e){}`,
`}`,
`if(d.readyState==='loading'){ d.addEventListener('DOMContentLoaded', inject); } else { inject(); }`,
`})();</script>`
    ].join('\n');
  },
};

A.buildTag = function(size, format='js'){
  const { sizeDims, abs, sanitizeUrl, substituteDest } = A.utils;
  const { jsTag, iframeTag, standaloneHTML } = A.tags;

  const { w,h } = sizeDims(size);
  const a = A.resolved(size);
  const t = A.state.creatives[size]?.trackers || { click:'', imps:[] };

  const dest     = sanitizeUrl(a.clickthrough || '');
  const clickUrl = substituteDest((t.click||'').trim(), dest) || dest;
  const media    = abs(a.mediaUrl || '');
  const pixels   = (t.imps||[]).filter(Boolean).map(u=>abs(u.trim()));

  if (format === 'html')   return standaloneHTML({w,h,media,clickUrl,pixels});
  if (format === 'iframe') return iframeTag({w,h,media,clickUrl,pixels});
  return jsTag({w,h,media,clickUrl,pixels});
};



function buildThirdPartyTag(size, format){
  const { w, h } = sizeDims(size);
  const a = resolved(size);
  const t = appState.creatives[size]?.trackers || { click:'', imps:[] };

  const dest     = sanitizeUrl(a.clickthrough || '');
  const clickUrl = substituteDest((t.click||'').trim(), dest) || dest;
  const media    = abs(a.mediaUrl || '');
  const pixels   = (t.imps||[]).filter(Boolean).map(u=>abs(u.trim()));

  if (format === 'html')   return standaloneHTML({w,h, media, clickUrl, pixels});
  if (format === 'iframe') return iframeTag({w,h, media, clickUrl, pixels});
  return jsTag({w,h, media, clickUrl, pixels}); // default js
}

/* ---------- All‑sizes PNG exporter (single source) ---------- */
// Replace your entire window.downloadPngZip with this
window.downloadPngZip = async function(){
  // Namespace + helpers
  const A = window.Adbuilder || {};
  const resolve   = A.resolved || window.resolved;
  const sizeDims  = (A.utils && A.utils.sizeDims)
    ? A.utils.sizeDims
    : (s=>{ const [w,h]=String(s).split('x').map(n=>parseInt(n,10)); return {w,h}; });
  const renderers = window.layoutRenderers || A.renderers || {};

  // Deps
  async function loadOnce(url){
    if ([...document.scripts].some(s=>s.src===url)) return;
    await new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src=url; s.async=true; s.onload=res; s.onerror=()=>rej(new Error('load '+url));
      document.head.appendChild(s);
    });
  }
  if (!window.html2canvas) await loadOnce('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  if (!window.JSZip)       await loadOnce('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');

  // Guards
  const sizes = Object.keys((A.state?.creatives) || (window.appState?.creatives) || {});
  if (!sizes.length){ alert('No creatives defined in appState.creatives.'); return; }
  if (typeof resolve !== 'function'){ alert('resolved(size) not found.'); return; }

  // Offscreen sandbox
  const sandbox = document.createElement('div');
  sandbox.id='__export_sandbox';
  sandbox.style.cssText='position:fixed;left:-10000px;top:0;width:0;height:0;pointer-events:none;background:#fff;z-index:-1;';
  document.body.appendChild(sandbox);

  // Render each size using your renderer map
  for (const size of sizes){
    const renderer = typeof renderers[size] === 'function' ? renderers[size] : null;
    if (!renderer) continue;
    const {w,h} = sizeDims(size);
    const html  = renderer(resolve(size));
    if (!html) continue;

    const wrap = document.createElement('div');
    wrap.className='export-capture';
    wrap.dataset.export='creative';
    wrap.dataset.name=size;
    wrap.style.cssText=`width:${w}px;height:${h}px;display:block;position:relative;background:#ffffff;overflow:hidden;`;
    wrap.innerHTML = html;
    sandbox.appendChild(wrap);
  }

  // Wait for images
  const imgs = Array.from(sandbox.querySelectorAll('img'));
  await Promise.all(imgs.map(img => img.complete ? Promise.resolve() :
    new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); })
  ));

  // Capture to zip
  const nodes = Array.from(sandbox.querySelectorAll('.export-capture'));
  if (!nodes.length){
    document.body.removeChild(sandbox);
    alert('No creatives rendered for export.');
    return;
  }

  const zip = new JSZip();
  for (let i=0;i<nodes.length;i++){
    const el   = nodes[i];
    const name = el.dataset.name || `creative_${i+1}`;
    const canvas = await html2canvas(el, {
      backgroundColor:'#ffffff',
      useCORS:true,
      scale:2,
      windowWidth:el.offsetWidth,
      windowHeight:el.offsetHeight
    });
    const blob = await new Promise(r=>canvas.toBlob(r,'image/png'));
    zip.file(`${name}.png`, blob);
  }

  // Cleanup + download
  document.body.removeChild(sandbox);
  const out = await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');
  const ts=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;};
  a.href=URL.createObjectURL(out);
  a.download=`creatives_${ts()}.zip`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
};



/* ---------- Dropdown wiring (single source) ---------- */
(function(){
  const root = document.getElementById('exportRoot');
  const btn  = document.getElementById('exportBtn');
  const menu = document.getElementById('exportMenu');

  if (menu?.hasAttribute('hidden')) menu.removeAttribute('hidden');

  // toggle dropdown
  btn?.addEventListener('click', (e)=>{
    e.stopPropagation();
    const open = root.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
  // close on outside
  document.addEventListener('click', (e)=>{
    if (!root?.classList.contains('is-open')) return;
    if (root.contains(e.target)) return;
    root.classList.remove('is-open');
    btn?.setAttribute('aria-expanded','false');
  });

  // actions
  menu?.addEventListener('click', async (e)=>{
    const b = e.target.closest('button[data-action]');
    if (!b) return;
    const act = b.getAttribute('data-action');
    root?.classList.remove('is-open');
    btn?.setAttribute('aria-expanded','false');

    if (act === 'tag'){ openExportModal(); }
    if (act === 'png'){ try { await window.downloadPngZip(); } catch(err){ console.error(err); alert('PNG export failed. See console.'); } }
  }, {capture:true});
})();
