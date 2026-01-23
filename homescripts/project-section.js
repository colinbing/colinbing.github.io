(function () {
  const sections = Array.from(document.querySelectorAll(".product-tools"));
  if (!sections.length) return;

  // adjust this if your navbar height changes
  const NAV_OFFSET = 87; // px

  function setupSection(section) {
    const overview = section.querySelector(".pt-overview");
    const detail = section.querySelector(".pt-detail");
    const backButton = section.querySelector(".pt-back");

    if (!overview || !detail || !backButton) return;

    const overviewCards = Array.from(section.querySelectorAll(".pt-card"));
    const tabs = Array.from(section.querySelectorAll(".pt-tab"));
    const panels = Array.from(section.querySelectorAll(".pt-panel"));

    function scrollFocusIntoView(focus, { center = false } = {}) {
      if (!focus) return;

      const rect = focus.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const focusHeight = focus.offsetHeight;
      const availableHeight = viewportHeight - NAV_OFFSET;

      let offset;
      if (center && focusHeight < availableHeight) {
        offset = (availableHeight - focusHeight) / 2 + NAV_OFFSET;
      } else {
        offset = NAV_OFFSET + 12;
      }

      const targetY = window.scrollY + rect.top - offset;

      window.scrollTo({
        top: Math.max(targetY, 0),
        behavior: "smooth",
      });
    }

    function scrollDetailIntoView({ center = false } = {}) {
      if (!detail) return;
      const focus = detail.querySelector(".pt-shell") || detail;
      scrollFocusIntoView(focus, { center });
    }

    function scrollOverviewIntoView({ center = false } = {}) {
      if (!overview) return;
      const focus = overview;
      scrollFocusIntoView(focus, { center });
    }

    function ensureDetailVisible() {
      if (!detail) return;
      const focus = detail.querySelector(".pt-shell") || detail;
      const rect = focus.getBoundingClientRect();
      const topLimit = NAV_OFFSET + 8;
      const bottomLimit = window.innerHeight - 24;

      if (rect.top < topLimit || rect.bottom > bottomLimit) {
        scrollDetailIntoView();
      }
    }

    function centerActiveTab(toolId) {
      const activeTab = tabs.find((tab) => tab.dataset.tool === toolId);
      if (!activeTab) return;

      // find the nearest horizontally scrollable parent for the tabs
      let container = activeTab.parentElement;
      while (
        container &&
        container.scrollWidth <= container.clientWidth &&
        container !== document.body
      ) {
        container = container.parentElement;
      }
      if (!container || container.scrollWidth <= container.clientWidth) return;

      const cRect = container.getBoundingClientRect();
      const tRect = activeTab.getBoundingClientRect();

      const scrollLeftTarget =
        container.scrollLeft +
        (tRect.left - cRect.left) -
        (cRect.width - tRect.width) / 2;

      container.scrollTo({
        left: scrollLeftTarget,
        behavior: "smooth",
      });
    }

    function showOverview() {
      overview.classList.remove("is-hidden");
      detail.classList.add("is-hidden");
      requestAnimationFrame(() => {
        scrollOverviewIntoView({ center: true });
      });
    }

    function showDetail(toolId) {
      overview.classList.add("is-hidden");
      detail.classList.remove("is-hidden");
      activateTool(toolId);
      requestAnimationFrame(() => {
        scrollDetailIntoView({ center: true });
        centerActiveTab(toolId);
      });
    }

    function activateTool(toolId) {
      tabs.forEach((tab) => {
        const active = tab.dataset.tool === toolId;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      panels.forEach((panel) => {
        const active = panel.dataset.tool === toolId;
        panel.classList.toggle("is-active", active);
      });
    }

    // snapshot cards → detail view
    overviewCards.forEach((card) => {
      card.addEventListener("click", () => {
        const toolId = card.dataset.tool;
        showDetail(toolId);
      });
    });

    // tabs row in detail view
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const toolId = tab.dataset.tool;
        activateTool(toolId);
        ensureDetailVisible();
        centerActiveTab(toolId);
      });
    });

    backButton.addEventListener("click", showOverview);
  }

  sections.forEach(setupSection);
})();
