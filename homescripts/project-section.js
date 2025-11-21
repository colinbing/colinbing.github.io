  (function () {
    const overview = document.getElementById("pt-overview");
    const detail = document.getElementById("pt-detail");
    const backButton = document.getElementById("pt-back-button");

    const overviewCards = Array.from(document.querySelectorAll(".pt-card"));
    const tabs = Array.from(document.querySelectorAll(".pt-tab"));
    const panels = Array.from(document.querySelectorAll(".pt-panel"));

    function showOverview() {
      overview.classList.remove("is-hidden");
      detail.classList.add("is-hidden");
      // Optional: clear active tab/panel if you want a neutral state when returning
    }

    function showDetail(toolId) {
      overview.classList.add("is-hidden");
      detail.classList.remove("is-hidden");
      activateTool(toolId);
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

    overviewCards.forEach((card) => {
      card.addEventListener("click", () => {
        const toolId = card.dataset.tool;
        showDetail(toolId);
      });
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const toolId = tab.dataset.tool;
        activateTool(toolId);
      });
    });

    backButton.addEventListener("click", showOverview);
  })();