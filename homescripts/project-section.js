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

    function scrollToDetailTopIfMobile() {
      if (window.innerWidth >= 768 || !detail) return;

      const rect = detail.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - NAV_OFFSET;

      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
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
    }

    function showDetail(toolId) {
      overview.classList.add("is-hidden");
      detail.classList.remove("is-hidden");
      activateTool(toolId);
      scrollToDetailTopIfMobile();
      centerActiveTab(toolId);
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
        scrollToDetailTopIfMobile();
        centerActiveTab(toolId);
      });
    });

    backButton.addEventListener("click", showOverview);
  }

  sections.forEach(setupSection);
})();
