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

/* 2) Renderers (unchanged API: take assets) */
function render970x250(assets) {
  return `
    <div class="ad-preview ad-970x250" data-size="970x250" style="width:970px; height:250px;">
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
    <div class="ad-preview ad-320x50" data-size="320x50">
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
    <div class="ad-preview ad-728x90" data-size="728x90">
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
    <div class="ad-preview ad-620x250" data-size="620x250">
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
    <div class="ad-preview ad-300x250" data-size="300x250">
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
    <div class="ad-preview ad-300x600" data-size="300x600">
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

/* 10) Optional: export button stub (safe no-op if absent) */
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const payload = {
    global: { ...appState.global },
    creatives: JSON.parse(JSON.stringify(appState.creatives))
  };
  console.log('Export payload', payload);
});

