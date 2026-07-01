(() => {
  const featuredSection = document.querySelector(".featured-builds");
  const tabButtons = Array.from(document.querySelectorAll("[data-build-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-build-panel]"));

  if (tabButtons.length && panels.length) {
    function activateBuild(buildId) {
      featuredSection?.setAttribute("data-active-build", buildId);

      tabButtons.forEach((button) => {
        const isActive = button.dataset.buildTab === buildId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        button.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.buildPanel === buildId;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    }

    const initialBuild = tabButtons.find((button) => button.classList.contains("is-active"))?.dataset.buildTab || tabButtons[0].dataset.buildTab;
    featuredSection?.setAttribute("data-active-build", initialBuild);

    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => activateBuild(button.dataset.buildTab));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabButtons.length - 1;

        tabButtons[nextIndex].focus();
        activateBuild(tabButtons[nextIndex].dataset.buildTab);
      });
    });
  }
})();

(() => {
  const root = document.querySelector("[data-spotlight-demo]");
  if (!root) return;

  const mockPath = "/images/project-mocks/spotlight/";

  const questions = [
    {
      id: "assetPackage",
      options: [
        { value: "single_image", label: "Single image" },
        { value: "multiple_images", label: "Carousel / multiple images" },
        { value: "video", label: "Standard video" },
        { value: "vertical_video", label: "Vertical mobile video" },
      ],
    },
    {
      id: "messageStyle",
      options: [
        { value: "minimal", label: "Light messaging" },
        { value: "standard", label: "Headline + description" },
        { value: "deep", label: "Richer story panel" },
      ],
    },
  ];

  const products = [
    {
      id: "storyteller",
      name: "Storyteller",
      height: "Short",
      tagline: "Full-bleed canvas for maximum impact",
      heroSummary: "Full-bleed image storytelling built to drive visual impact and clicks across devices.",
      image: `${mockPath}thumbnail-storyteller_v2.png`,
      devices: {
        mobile: { frame: "375x375" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "691cdec5b791e9fe82ee28f0_Ta1lPvVdA",
        tagData: {},
      },
    },
    {
      id: "gallery",
      name: "Gallery",
      height: "Short",
      tagline: "Showcase multiple products/features",
      heroSummary: "Interactive multi-image carousel for product features, discovery, and in-unit engagement.",
      image: `${mockPath}gallery.jpg`,
      devices: {
        mobile: { frame: "375x375" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69b0522cf02ece04fef5c851_CD8CmlHt9",
        tagData: {
          WP_DEST_URL_UNESC:
            "https://www.weschlers.com/auction/march-27-capital-collections-featuring-a-potomac-collection/?utm_source&#x3D;WashPost*&utm_medium&#x3D;Digital&utm_campaign&#x3D;1527CC&utm_id&#x3D;1527*WP*Carousel",
          WP_CLICK_URL_UNESC: "%%TTD_CLK%%",
          WP_AD_SERVER: "ttd",
          WP_CREATIVE_ID: "%%TTD_CREATIVEID_INT%%",
          WP_WIDTH: "3",
          WP_HEIGHT: "1",
        },
      },
    },
    {
      id: "video",
      name: "Video",
      height: "Short",
      tagline: "Dynamically optimized across platforms",
      heroSummary: "Standard video unit optimized to maximize player size and performance across devices.",
      image: `${mockPath}thumbnail-video_v2.png`,
      devices: {
        mobile: { frame: "375x375" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69c6cd2af02ece04fef6724b_LcEe2hTcD",
        tagData: {},
      },
    },
    {
      id: "video-canvas",
      name: "Video Canvas",
      height: "Short",
      tagline: "Add contextual brand messaging",
      heroSummary: "Full-bleed video with dedicated headline, description, and CTA support.",
      image: `${mockPath}thumbnail-video-canvas_v2.png`,
      devices: {
        mobile: { frame: "375x375" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69cd7482f02ece04fef69712_nhxj0hVcn",
        tagData: {},
      },
    },
    {
      id: "storyteller-xl",
      name: "Storyteller XL",
      height: "Tall",
      tagline: "Fully immersive ad experience",
      heroSummary: "Immersive edge-to-edge image format for premium visual storytelling across screens.",
      image: `${mockPath}storyteller-xl.png`,
      devices: {
        mobile: { frame: "375x600" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69bc5f1ff02ece04fef632fb_mVa9cwyBa",
        tagData: {},
      },
    },
    {
      id: "gallery-xl",
      name: "Gallery XL",
      height: "Tall",
      tagline: "Sync visuals and copy for deeper stories",
      heroSummary: "Large-format slideshow pairing visuals and synchronized copy for deeper brand stories.",
      image: `${mockPath}gallery-xl.png`,
      devices: {
        mobile: { frame: "375x600" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69cd755af22bd08946953d93_xzqg_YKZS",
        tagData: {},
      },
    },
    {
      id: "video-xl",
      name: "Video XL",
      height: "Tall",
      tagline: "Edge-to-edge for max brand visibility",
      heroSummary: "Premium immersive video format built for widescreen impact across desktop and mobile.",
      image: `${mockPath}thumbnail-video-xl_v2.png`,
      devices: {
        mobile: { frame: "375x600" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69b45051f02ece04fef5f204_78jCE2XOt",
        tagData: {
          WP_DEST_URL_UNESC: "https://www.uber.com/us/en/safety/womens-safety/",
          WP_CLICK_URL_UNESC: "%%TTD_CLK%%",
          WP_AD_SERVER: "ttd",
          WP_CREATIVE_ID: "%%TTD_CREATIVEID_INT%%",
          WP_WIDTH: "3",
          WP_HEIGHT: "600",
        },
      },
    },
    {
      id: "vertical-video-xl",
      name: "Vertical Video XL",
      height: "Tall",
      tagline: "Fully immersive vertical video",
      heroSummary: "Mobile-only vertical video experience for premium full-screen storytelling.",
      image: `${mockPath}vertical-video-xl.png`,
      devices: {
        mobile: { frame: "375x667" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69b84123f22bd0894694ac8b_TzFaLLdFY",
        tagData: {},
      },
    },
    {
      id: "video-canvas-xl",
      name: "Video Canvas XL",
      height: "Tall",
      tagline: "Blend video and messaging in our largest ad canvas",
      heroSummary: "Largest video-plus-message canvas for immersive motion with dedicated brand copy.",
      image: `${mockPath}video-canvas-xl.jpg`,
      devices: {
        mobile: { frame: "375x600" },
      },
      livePreview: {
        scriptSrc: "https://www.washingtonpost.com/red-static/public/static/wp-load-creative-v4.js",
        creativeId: "69cd74f7f02ece04fef697e5_wFdQXbIXY",
        tagData: {},
      },
    },
  ];

  const profiles = {
    storyteller: {
      primaryPackages: ["single_image"],
      flexiblePackages: ["multiple_images"],
      primaryMessageStyles: ["minimal", "standard"],
      flexibleMessageStyles: [],
    },
    gallery: {
      primaryPackages: ["multiple_images"],
      flexiblePackages: ["single_image"],
      primaryMessageStyles: ["minimal", "standard"],
      flexibleMessageStyles: [],
    },
    video: {
      primaryPackages: ["video"],
      flexiblePackages: [],
      primaryMessageStyles: ["minimal"],
      flexibleMessageStyles: [],
    },
    "video-canvas": {
      primaryPackages: ["video"],
      flexiblePackages: [],
      primaryMessageStyles: ["standard"],
      flexibleMessageStyles: [],
    },
    "storyteller-xl": {
      primaryPackages: ["single_image"],
      flexiblePackages: ["multiple_images"],
      primaryMessageStyles: ["minimal", "standard"],
      flexibleMessageStyles: [],
    },
    "gallery-xl": {
      primaryPackages: ["multiple_images"],
      flexiblePackages: ["single_image"],
      primaryMessageStyles: ["deep"],
      flexibleMessageStyles: ["standard"],
    },
    "video-xl": {
      primaryPackages: ["video"],
      flexiblePackages: ["single_image"],
      primaryMessageStyles: ["minimal"],
      flexibleMessageStyles: ["standard"],
    },
    "vertical-video-xl": {
      primaryPackages: ["vertical_video"],
      flexiblePackages: [],
      primaryMessageStyles: ["minimal"],
      flexibleMessageStyles: [],
    },
    "video-canvas-xl": {
      primaryPackages: ["video"],
      flexiblePackages: ["single_image", "multiple_images"],
      primaryMessageStyles: ["deep"],
      flexibleMessageStyles: ["standard"],
    },
  };

  const state = {
    assetPackage: null,
    messageStyle: null,
    screen: "setup",
  };

  const countEl = root.querySelector("[data-spotlight-count]");
  const resultsEl = root.querySelector("[data-spotlight-results]");
  const submitBtn = root.querySelector("[data-spotlight-submit]");
  const resetBtn = root.querySelector("[data-spotlight-reset]");
  let resizeFrame = 0;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function getFrameDimensions(frame) {
    const match = /(\d+)x(\d+)/i.exec(frame || "");
    if (!match) {
      return { width: 375, height: 375 };
    }

    return {
      width: Number.parseInt(match[1], 10),
      height: Number.parseInt(match[2], 10),
    };
  }

  function getRenderableFrameDimensions(product) {
    const dimensions = getFrameDimensions(product.devices?.mobile?.frame);

    if (product.id === "vertical-video-xl") {
      return {
        width: dimensions.width,
        height: 600,
      };
    }

    return dimensions;
  }

  function getWpTagDocument(product, scriptWidth, scriptHeight) {
    const fallback = getRenderableFrameDimensions(product);
    const { scriptSrc, creativeId, tagData = {} } = product.livePreview;
    const configuredWidth = tagData.WP_WIDTH;
    const configuredHeight = tagData.WP_HEIGHT;
    const width = scriptWidth ?? (configuredWidth === "" || configuredWidth == null ? fallback.width : configuredWidth);
    const height = scriptHeight ?? (configuredHeight === "" || configuredHeight == null ? fallback.height : configuredHeight);

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent !important;
      }

      body {
        display: grid;
        place-items: stretch;
      }

      body > *:not(script) {
        background: transparent !important;
      }
    </style>
  </head>
  <body>
    <script
      data-WP_DEST_URL_UNESC="${escapeAttribute(tagData.WP_DEST_URL_UNESC ?? "")}"
      data-WP_CLICK_URL_UNESC="${escapeAttribute(tagData.WP_CLICK_URL_UNESC ?? "")}"
      data-WP_AD_SERVER="${escapeAttribute(tagData.WP_AD_SERVER ?? "")}"
      data-WP_LINE_ITEM_ID="${escapeAttribute(tagData.WP_LINE_ITEM_ID ?? "")}"
      data-WP_CREATIVE_ID="${escapeAttribute(tagData.WP_CREATIVE_ID ?? "")}"
      data-WP_WIDTH="${escapeAttribute(width)}"
      data-WP_HEIGHT="${escapeAttribute(height)}"
      data-WP_AD_UNIT="${escapeAttribute(tagData.WP_AD_UNIT ?? "")}"
      data-WP_AD_UNIT_ID="${escapeAttribute(tagData.WP_AD_UNIT_ID ?? "")}"
      data-WP_CACHE_BUSTER="${Date.now()}"
      src="${escapeAttribute(scriptSrc)}"
      data-id="${escapeAttribute(creativeId)}"
      onload="WPLoadCreative(this)"
    ><\/script>
    <script>
      const INTERACTIVE_CONTROL_SELECTOR = [
        "button",
        "[role='button']",
        "[role='tab']",
        "[role='switch']",
        "[role='checkbox']",
        "[role='radio']",
        "input",
        "select",
        "textarea",
        "label",
        "summary",
        "video",
        "audio",
        "[tabindex]:not([tabindex='-1'])",
        "[aria-label*='play' i]",
        "[aria-label*='pause' i]",
        "[aria-label*='next' i]",
        "[aria-label*='previous' i]",
        "[aria-label*='prev' i]",
        "[aria-label*='mute' i]",
        "[aria-label*='unmute' i]",
        "[class*='play' i]",
        "[class*='pause' i]",
        "[class*='next' i]",
        "[class*='prev' i]",
        "[class*='arrow' i]",
        "[class*='carousel' i]",
        "[class*='slider' i]",
        "[class*='control' i]",
      ].join(",");

      const forceTransparentShell = () => {
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
        Array.from(document.body.children).forEach((node) => {
          if (node.tagName !== "SCRIPT") {
            node.style.background = "transparent";
          }
        });
      };

      const preventOutboundNavigation = (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        const target = event.target;
        const clickedLink = target.closest("a[href]");
        const interactiveControl = target.closest(INTERACTIVE_CONTROL_SELECTOR);

        if (clickedLink) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        if (!interactiveControl) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      };

      window.open = () => null;
      document.addEventListener("click", preventOutboundNavigation, true);
      document.addEventListener("auxclick", preventOutboundNavigation, true);

      new MutationObserver(forceTransparentShell).observe(document.body, {
        childList: true,
        subtree: true,
      });

      window.addEventListener("load", () => {
        forceTransparentShell();
        window.setTimeout(forceTransparentShell, 150);
      });
    <\/script>
  </body>
</html>`;
  }

  function getRecommendationScore(product, criteria = state) {
    const profile = profiles[product.id];
    if (!profile || !criteria.assetPackage) return -1;

    const supportsMessageStyle =
      !criteria.messageStyle ||
      profile.primaryMessageStyles.includes(criteria.messageStyle) ||
      profile.flexibleMessageStyles.includes(criteria.messageStyle);

    if (!supportsMessageStyle) return -99;

    let score = 0;

    if (profile.primaryPackages.includes(criteria.assetPackage)) score += 6;
    else if (profile.flexiblePackages.includes(criteria.assetPackage)) score += 3;
    else return -99;

    if (criteria.messageStyle) {
      if (profile.primaryMessageStyles.includes(criteria.messageStyle)) score += 4;
      else if (profile.flexibleMessageStyles.includes(criteria.messageStyle)) score += 2;
    }

    if (product.height === "Tall") score += 0.2;
    if (product.id.includes("canvas") && criteria.messageStyle === "standard") score += 0.6;

    if (criteria.assetPackage === "multiple_images" && (product.id === "storyteller" || product.id === "storyteller-xl")) {
      score += 0.8;
    }

    return score;
  }

  function getRecommendationMatches(criteria = state) {
    if (!criteria.assetPackage || !criteria.messageStyle) return [];

    const matches = products
      .map((product) => ({ product, score: getRecommendationScore(product, criteria) }))
      .filter(({ score }) => score > -50)
      .sort((a, b) => b.score - a.score);

    if (!matches.length) return [];

    const strongestScore = matches[0].score;
    const minimumVisibleScore = criteria.messageStyle ? Math.max(6, strongestScore - 2.5) : Math.max(3.7, strongestScore - 2.5);

    return matches.filter(({ score }) => score >= minimumVisibleScore).slice(0, 4);
  }

  function hasCompatibleMatches(questionId, value) {
    const candidate = {
      assetPackage: state.assetPackage,
      messageStyle: state.messageStyle,
      [questionId]: value,
    };

    if (candidate.assetPackage && candidate.messageStyle) {
      return getRecommendationMatches(candidate).length > 0;
    }

    if (candidate.assetPackage) {
      const messageQuestion = questions.find((question) => question.id === "messageStyle");
      return messageQuestion.options.some((option) =>
        getRecommendationMatches({
          assetPackage: candidate.assetPackage,
          messageStyle: option.value,
        }).length > 0
      );
    }

    if (candidate.messageStyle) {
      const assetQuestion = questions.find((question) => question.id === "assetPackage");
      return assetQuestion.options.some((option) =>
        getRecommendationMatches({
          assetPackage: option.value,
          messageStyle: candidate.messageStyle,
        }).length > 0
      );
    }

    return true;
  }

  function renderTagPreviews() {
    const mounts = Array.from(root.querySelectorAll("[data-spotlight-live-preview]"));

    mounts.forEach((mount) => {
      const product = products.find((item) => item.id === mount.dataset.productId);
      if (!product?.livePreview) return;

      const dimensions = getRenderableFrameDimensions(product);
      const maxWidth = Math.max(1, mount.clientWidth || 240);
      const maxHeight = product.height === "Tall" ? 210 : 200;
      const scale = Math.min(1, maxWidth / dimensions.width, maxHeight / dimensions.height);
      const displayWidth = Math.round(dimensions.width * scale);
      const displayHeight = Math.round(dimensions.height * scale);
      const configuredWidth = Number.parseInt(product.livePreview.tagData?.WP_WIDTH ?? "", 10);
      const configuredHeight = Number.parseInt(product.livePreview.tagData?.WP_HEIGHT ?? "", 10);

      mount.style.width = `${displayWidth}px`;
      mount.style.height = `${displayHeight}px`;
      mount.innerHTML = "";

      const iframe = document.createElement("iframe");
      iframe.className = "spotlight-live-frame";
      iframe.title = `${product.name} mobile creative preview`;
      iframe.width = String(dimensions.width);
      iframe.height = String(dimensions.height);
      iframe.style.width = `${dimensions.width}px`;
      iframe.style.height = `${dimensions.height}px`;
      iframe.style.transform = `scale(${scale})`;
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
      iframe.setAttribute("allow", "autoplay; fullscreen");
      iframe.srcdoc = getWpTagDocument(
        product,
        Number.isFinite(configuredWidth) && configuredWidth > 0 ? configuredWidth : undefined,
        Number.isFinite(configuredHeight) && configuredHeight > 0 ? configuredHeight : undefined
      );
      mount.appendChild(iframe);
    });
  }

  function configureResultsCarousel() {
    const track = root.querySelector("[data-spotlight-results-track]");

    if (!(track instanceof HTMLElement)) return;
    const cards = Array.from(track.querySelectorAll(".spotlight-result-card"));

    function updateActiveCard() {
      let closestCard = null;
      let closestDistance = Number.POSITIVE_INFINITY;
      const trackLeft = track.getBoundingClientRect().left;

      cards.forEach((card) => {
        const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }
      });

      cards.forEach((card) => {
        card.classList.toggle("is-active", card === closestCard);
      });
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        window.setTimeout(updateActiveCard, 260);
      });
      card.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        window.setTimeout(updateActiveCard, 260);
      });
    });

    track.addEventListener("scroll", updateActiveCard, { passive: true });
    updateActiveCard();
  }

  function selectedCount() {
    return Number(Boolean(state.assetPackage)) + Number(Boolean(state.messageStyle));
  }

  function updateShellState() {
    const matches = getRecommendationMatches();
    const selections = selectedCount();
    const isReady = selections === questions.length;
    const isResults = state.screen === "results";

    root.classList.toggle("is-results", isResults);
    if (submitBtn) {
      submitBtn.disabled = !isReady;
      submitBtn.textContent = isReady ? "Get product recommendations" : `Choose ${questions.length - selections} more`;
    }
    if (resetBtn) {
      resetBtn.hidden = !isResults;
    }
    if (countEl) {
      if (isResults) {
        countEl.textContent = `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
      } else if (isReady) {
        countEl.textContent = `${matches.length} ready`;
      } else {
        countEl.textContent = `${selections} of ${questions.length} selected`;
      }
    }
  }

  function renderOptions() {
    questions.forEach((question) => {
      const container = root.querySelector(`[data-spotlight-options="${question.id}"]`);
      if (!container) return;

      container.innerHTML = "";
      question.options.forEach((option) => {
        const isActive = state[question.id] === option.value;
        const isDisabled = !isActive && !hasCompatibleMatches(question.id, option.value);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "spotlight-demo-option";
        button.textContent = option.label;
        button.dataset.value = option.value;
        button.disabled = isDisabled;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
        button.addEventListener("click", () => {
          if (button.disabled) return;
          state[question.id] = state[question.id] === option.value ? null : option.value;
          renderOptions();
          if (state.screen === "results") renderResults();
          updateShellState();
        });
        container.appendChild(button);
      });
    });
  }

  function renderResults() {
    const matches = getRecommendationMatches();

    if (!matches.length) {
      resultsEl.innerHTML = `
        <article class="spotlight-result-card">
          <div>
            <h3>No direct match</h3>
            <p>Adjust one option to find the closest Spotlight format.</p>
          </div>
        </article>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="spotlight-results-head">
        <h3>Recommended products <span>${matches.length} ${matches.length === 1 ? "match" : "matches"}</span></h3>
      </div>
      <div class="spotlight-results-track" data-spotlight-results-track tabindex="0" aria-label="Recommended Spotlight products">
        ${matches
          .map(({ product }) => {
        return `
          <article class="spotlight-result-card" tabindex="0" aria-label="Show ${escapeAttribute(product.name)} recommendation">
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              <strong>${escapeHtml(product.tagline)}</strong>
              <p>${escapeHtml(product.heroSummary)}</p>
            </div>
            <div class="spotlight-live-preview-shell">
              <div
                class="spotlight-live-preview"
                data-spotlight-live-preview
                data-product-id="${escapeAttribute(product.id)}"
                aria-label="${escapeAttribute(product.name)} mobile creative"
              ></div>
            </div>
          </article>
        `;
      })
          .join("")}
      </div>
    `;

    renderTagPreviews();
    configureResultsCarousel();
  }

  function showResults() {
    if (selectedCount() !== questions.length) return;
    state.screen = "results";
    renderResults();
    updateShellState();
  }

  function resetSelections() {
    state.assetPackage = null;
    state.messageStyle = null;
    state.screen = "setup";
    resultsEl.innerHTML = "";
    renderOptions();
    updateShellState();
  }

  renderOptions();
  updateShellState();
  submitBtn?.addEventListener("click", showResults);
  resetBtn?.addEventListener("click", resetSelections);
  window.addEventListener("resize", () => {
    if (state.screen !== "results") return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(renderTagPreviews);
  });
})();
