(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-toggle-label]");
  const storedTheme = localStorage.getItem("projects-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme || (prefersDark ? "dark" : "light");

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("projects-theme", theme);
    if (!themeToggle || !themeLabel) return;
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeLabel.textContent = isDark ? "Light" : "Dark";
  }

  setTheme(initialTheme);
  themeToggle?.addEventListener("click", () => {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
})();

(() => {
  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll(".project-card[data-categories]"));
  const drawer = document.querySelector("[data-case-drawer]");
  const closeButton = document.querySelector("[data-case-close]");
  const panels = Array.from(document.querySelectorAll("[data-case-panel]"));
  const triggers = Array.from(document.querySelectorAll("[data-case-trigger]"));

  if (!buttons.length || !cards.length) return;

  function closeCase() {
    drawer.hidden = true;
    panels.forEach((panel) => { panel.hidden = true; });
    cards.forEach((card) => { card.classList.remove("is-active"); });
    triggers.forEach((trigger) => { trigger.setAttribute("aria-expanded", "false"); });
  }

  function openCase(caseId) {
    const panel = panels.find((item) => item.dataset.casePanel === caseId);
    const card = cards.find((item) => item.dataset.caseCard === caseId);
    if (!panel || !card) return;

    drawer.hidden = false;
    panels.forEach((item) => { item.hidden = item !== panel; });
    cards.forEach((item) => { item.classList.toggle("is-active", item === card); });
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", trigger.dataset.caseTrigger === caseId ? "true" : "false");
    });
    drawer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setFilter(filter) {
    buttons.forEach((button) => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    cards.forEach((card) => {
      const categories = card.dataset.categories.split(/\s+/);
      const shouldShow = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !shouldShow);
    });

    const activeCard = document.querySelector(".project-card.is-active");
    if (activeCard?.classList.contains("is-hidden")) closeCase();
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", () => openCase(trigger.dataset.caseTrigger));
  });

  closeButton?.addEventListener("click", closeCase);
  panels.forEach((panel) => { panel.hidden = true; });
})();
