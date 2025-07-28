// adbuilder.js

const creativeAssets = {
    logoUrl: "images/demo-images/washington-gas-logo.png",
    imageUrl: "images/demo-images/washington-gas.png",
    headline: "ENERGY UPGRADES FOR YOUR BUSINESS",
    description: "Earn rebates on high-efficiency systems.",
    ctaText: "Learn More",
    clickthrough: "https://example.com"
  };
  
  const layoutRenderers = {
    "970x250": render970x250,
    "728x90": render728x90,
    "620x250": render620x250,
    "300x250": render300x250,
    "300x600": render300x600,
    "320x50": render320x50
  };
  
  function render970x250(assets) {
    return `
      <div class="ad-preview ad-970x250" style="width:970px; height:250px;">
        <div class="left-content">
          <img class="logo" src="${assets.logoUrl}" alt="Logo" />
          <h1 class="headline">${assets.headline}</h1>
          <p class="description">${assets.description}</p>
          <a class="cta-button" href="${assets.clickthrough}">${assets.ctaText}</a>
        </div>
        <div class="right-content">
          <img class="media" src="${assets.imageUrl}" alt="Media" />
        </div>
      </div>
    `;
  }
  
  function render320x50(assets) {
    return `
      <div class="ad-preview ad-320x50">
        <img class="logo" src="${assets.logoUrl}" alt="Logo" />
        <div class="text-wrapper">
          <div class="headline">${assets.headline}</div>
        </div>
        <button class="cta">${assets.ctaText}</button>
      </div>
    `;
  }
  
  function render728x90(assets) {
    return `
      <div class="ad-preview ad-728x90">
        <div class="left-column">
          <img class="logo" src="${assets.logoUrl}" alt="Logo" />
        </div>
        <div class="middle-column">
          <div class="headline">${assets.headline}</div>
          <div class="description">${assets.description}</div>
        </div>
        <div class="right-column">
          <img class="media" src="${assets.imageUrl}" alt="Media" />
        </div>
      </div>
    `;
  }
  
  function render620x250(assets) {
    return `
      <div class="ad-preview ad-620x250">
        <div class="left-content">
          <div class="logo-wrapper">
            <img class="logo" src="${assets.logoUrl}" alt="Logo" />
          </div>
          <div class="headline">${assets.headline}</div>
          <div class="description">${assets.description}</div>
          <a class="cta-button" href="${assets.clickthrough}">${assets.ctaText}</a>
        </div>
        <div class="right-media">
          <img src="${assets.imageUrl}" alt="Media" />
        </div>
      </div>
    `;
  }
  
  function render300x250(assets) {
    return `
      <div class="ad-preview ad-300x250">
        <div class="media">
          <img src="${assets.imageUrl}" alt="Media" />
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
      <div class="ad-preview ad-300x600">
        <div class="media">
          <img src="${assets.imageUrl}" alt="Media" />
        </div>
        <div class="text-block">
          <div class="headline">${assets.headline}</div>
          <div class="description">${assets.description}</div>
          <a class="cta" href="${assets.clickthrough}">${assets.ctaText}</a>
        </div>
      </div>
    `;
  }
  
  function setHighlight(el) {
    const smiTop = el.offsetTop;
    const contentTop = document.querySelector('.side-menu-content').offsetTop;
  
    const offsetTop = contentTop + smiTop;
    const height = el.offsetHeight;
  
    const highlight = document.querySelector('.smi-highlight');
    highlight.style.top = offsetTop + 'px';
    highlight.style.height = height + 'px';
  }
  
  function renderLayout(layoutId) {
    const preview = document.getElementById("creative-preview");
    const renderer = layoutRenderers[layoutId];
    if (!renderer) return;
    preview.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%;">${renderer(creativeAssets)}</div>`;
  }
  
  document.querySelectorAll('.side-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.side-menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      setHighlight(item);
      const layoutId = item.getAttribute('data-layout');
      renderLayout(layoutId);
    });
  });
  
  // Initial render
  const defaultLayout = document.querySelector('.side-menu-item.active').getAttribute('data-layout');
  renderLayout(defaultLayout);
  setHighlight(document.querySelector('.side-menu-item.active'));
  