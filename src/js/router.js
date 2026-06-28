/* page router */

import { initHome } from './pages/home.js';
import { setupBookings } from './pages/booking.js';
import { setupPortfolio } from './pages/portfolio.js';
import { initPlay, teardownPlay } from './play.js';

const PAGES = {
  home:      { file: 'src/pages/home.html',      css: 'src/css/pages/home.css' },
  portfolio: { file: 'src/pages/portfolio.html', css: 'src/css/pages/portfolio.css' },
  booking:   { file: 'src/pages/booking.html',   css: 'src/css/pages/booking.css' },
  contact:   { file: 'src/pages/contact.html',   css: 'src/css/pages/contact-socials.css' },
  socials:   { file: 'src/pages/socials.html',   css: 'src/css/pages/contact-socials.css' },
  play: { file: 'src/play/play.html', css: 'src/play/play.css' },
};

const main = document.getElementById('main-content');
let currentPage = null;

// loading pages
async function loadPage(key, pushState = true) {
  if (key === currentPage) return;
  const config = PAGES[key];
  if (!config) return;

  // fade out current page
  main.classList.add('fading');
  await new Promise(r => setTimeout(r, 380));

  // fetch html, inject
  try {
    const res  = await fetch(config.file);
    const html = await res.text();
    main.innerHTML = html;
  } catch {
    main.innerHTML = '<p style="padding:4rem;color:var(--muted)">Page not found.</p>';
  }

  // inject css
  if (config.css && !document.querySelector(`link[href="${config.css}"]`)) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = config.css;
    document.head.appendChild(link);
  }

  // scroll to top, fade in new page
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.classList.remove('fading');

  // updates
  currentPage = key;
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === key);
  });
  if (pushState) history.pushState({ page: key }, '', '#' + key);

  // run page scripts if needed
  document.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page: key } }));
}

// checking for link clicks
document.addEventListener('click', e => {
  const link = e.target.closest('[data-page]');
  if (!link) return;
  e.preventDefault();
  loadPage(link.dataset.page);
});

// back/forward navigation
window.addEventListener('popstate', e => {
  loadPage(e.state?.page || 'home', false);
});

// inital/default
const initial = location.hash.replace('#', '') || 'home';
loadPage(initial, false);

// execute scripts as needed
document.addEventListener('pageLoaded', ({ detail }) => {
  if (detail.page === 'home') {
    initHome();
  }
  if (detail.page === 'socials') {
    const d=document,s=d.createElement("script");s.type="module";
    s.src="https://w.behold.so/widget.js";d.head.append(s);
  }
  if (detail.page === 'booking') {
    setupBookings();
  }
  if (detail.page === 'portfolio') {
    setupPortfolio();
  }
  if (detail.page === 'play') {
    initPlay();
  } else {
    teardownPlay();
  }
});
