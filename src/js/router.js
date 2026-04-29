const PAGES = {
  home:      { file: 'pages/home.html',      css: 'css/pages/home.css' },
  portfolio: { file: 'pages/portfolio.html', css: 'css/pages/portfolio.css' },
  booking:   { file: 'pages/booking.html',   css: 'css/pages/booking.css' },
  contact:   { file: 'pages/contact.html',   css: 'css/pages/contact.css' },
  socials:   { file: 'pages/socials.html',   css: 'css/pages/socials.css' },
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

  // fetch html, inect
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