/**
 * router.js
 * Handles SPA-style navigation: fade out → swap page → fade in
 * No page reloads. Nav stays fixed.
 */

const Router = (() => {
  let currentPage = null;

  function getEl(id) {
    return document.getElementById('page-' + id);
  }

  function showPage(id, pushState = true) {
    const target = getEl(id);
    if (!target || currentPage === id) return;

    const prev = currentPage ? getEl(currentPage) : null;

    // ── Fade out previous ──
    if (prev) {
      prev.style.opacity = '0';
      prev.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        prev.classList.remove('active', 'visible');
        prev.style.opacity = '';
        prev.style.transform = '';
      }, 320);
    }

    currentPage = id;

    // ── Fade in new page ──
    setTimeout(() => {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Double rAF to allow display:block to take effect before transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.classList.add('visible');
        });
      });

      // Fire page-specific init hooks
      document.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: id } }));
    }, prev ? 300 : 0);

    // ── Update active nav links ──
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === id);
    });

    // ── History API ──
    if (pushState) {
      history.pushState({ page: id }, '', '#' + id);
    }
  }

  function init() {
    // Delegate all [data-page] clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-page]');
      if (!link) return;
      e.preventDefault();
      showPage(link.dataset.page);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', e => {
      const id = e.state?.page || 'home';
      showPage(id, false);
    });

    // Load correct page from hash on initial load
    const hash = location.hash.replace('#', '');
    const startPage = hash || 'home';
    showPage(startPage, false);
  }

  return { init, showPage };
})();

export default Router;