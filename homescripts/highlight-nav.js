// highlight-nav.js

// Explicit mapping: which nav links should react to scroll,
// and which section they correspond to.
const navMap = [
  { selector: '#navbar .nav-link[href="#"]',                sectionId: 'intro-section' },
  { selector: '#navbar .nav-link[href="#skills-section"]',  sectionId: 'skills-section' },
  { selector: '#navbar .nav-link[href="#experience-section"]',    sectionId: 'experience-section' },
  { selector: '#navbar .nav-link[href="#certification-section"]', sectionId: 'certification-section' },
  { selector: '#navbar .nav-link[href="#project-section"]',       sectionId: 'project-section' },
  { selector: '#navbar .nav-link[href="#education-section"]',     sectionId: 'education-section' },
  // NOTE: Contact is intentionally NOT in this list, so the bottom of page
  // still counts as "Education" for highlighting purposes.
];

const navItems = navMap
  .map(({ selector, sectionId }) => {
    const link = document.querySelector(selector);
    const section = document.getElementById(sectionId);
    if (!link || !section) return null;
    return { link, section };
  })
  .filter(Boolean);

const navbar = document.getElementById('navbar');

// Bail if something went very wrong
if (navItems.length) {
  const NAV_OFFSET = document.querySelector('.navbar')?.offsetHeight || 64;

  function setActiveFromScroll() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    // Default to the first (About)
    let activeIndex = 0;

    // If we're essentially at the bottom of the page,
    // force the last tracked section (Education) to be active.
    if (scrollY + viewportHeight >= pageHeight - 2) {
      activeIndex = navItems.length - 1;
    } else {
      // Walk through sections in order and find the last one we've
      // scrolled past the top of (minus a small offset for nav height).
      for (let i = 0; i < navItems.length; i++) {
        const secTop = navItems[i].section.offsetTop - NAV_OFFSET - 40;
        if (scrollY >= secTop) {
          activeIndex = i;
        } else {
          break;
        }
      }
    }

    navItems.forEach((item, idx) => {
      const li = item.link.closest('.nav-item');
      if (!li) return;
      li.classList.toggle('active', idx === activeIndex);
    });

    if (navbar) {
      navbar.classList.toggle('navbar--compact', scrollY > 24);
    }
  }

  // Run once and on scroll
  setActiveFromScroll();
  window.addEventListener('scroll', setActiveFromScroll, { passive: true });
}
