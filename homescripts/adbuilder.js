const creativeAssets = {
    logoUrl: "images/demo-images/washington-gas-logo.png",
    imageUrl: "images/demo-images/washington-gas.png",
    headline: "Energy-saving upgrades are good for any business.",
    description: "Get generous incentives for boiler systems, gas heating equipment and more.",
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
          <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
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
        <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
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
          <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
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
      <div class="ad-300x600">
        <div class="logo-row">
          <img class="logo" src="${assets.logoUrl || ''}" alt="Logo" />
        </div>
        <div class="media">
          <img src="${assets.imageUrl || ''}" alt="Main Visual" />
        </div>
        <div class="text-block">
          <h1 class="headline">${assets.headline || ''}</h1>
          <p class="description">${assets.description || ''}</p>
          <a class="cta-button" href="${assets.clickthrough}" target="_blank" rel="noopener noreferrer">${assets.ctaText}</a>
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
  
    if (layoutId === 'assets') {
      renderGlobalAssetsForm();
      return;
    }
  
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
  
  const defaultLayout = document.querySelector('.side-menu-item.active').getAttribute('data-layout');
  renderLayout(defaultLayout);
  setHighlight(document.querySelector('.side-menu-item.active'));
  
  // Global assets form logic
  function renderGlobalAssetsForm() {
    const preview = document.getElementById("creative-preview");
    preview.innerHTML = `
      <div class="global-assets-form" style="max-width: 500px; margin: 40px auto; padding: 20px; border: 1px solid #ccc; background: white; border-radius: 6px;">
        <h2 style="margin-top:0;">Global Creative Assets</h2>
        <form id="globalAssetsForm">
          <label>Headline:<br />
            <input type="text" name="headline" placeholder="Enter headline" style="width:100%;" />
          </label><br /><br />
          <label>Description:<br />
            <input type="text" name="description" placeholder="Enter description" style="width:100%;" />
          </label><br /><br />
          <label>CTA Text:<br />
            <input type="text" name="cta" placeholder="Enter CTA" style="width:100%;" />
          </label><br /><br />
          <label>Clickthrough URL:<br />
            <input type="url" name="clickthrough" placeholder="https://example.com" style="width:100%;" />
          </label><br /><br />
          <label>Logo Image:<br />
            <input type="file" name="logo" accept="image/*" />
          </label><br /><br />
          <label>Media Image or Video:<br />
            <input type="file" name="media" accept="image/*,video/*" />
          </label><br /><br />
          <button type="submit">Save Assets</button>
        </form>
      </div>
    `;
  
    const form = document.getElementById('globalAssetsForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
  
      const formData = new FormData(form);
  
      creativeAssets.headline = formData.get('headline') || '';
      creativeAssets.description = formData.get('description') || '';
      creativeAssets.ctaText = formData.get('cta') || '';
      creativeAssets.clickthrough = formData.get('clickthrough') || '';
  
      const logoFile = formData.get('logo');
      const mediaFile = formData.get('media');
  
      if (logoFile && logoFile.name) {
        creativeAssets.logoUrl = URL.createObjectURL(logoFile);
      }
      if (mediaFile && mediaFile.name) {
        creativeAssets.imageUrl = URL.createObjectURL(mediaFile);
      }
  
      alert('Global assets saved!');
    });
  }
  