// Hamburger menu toggle
const hamburger = document.getElementById('hamburger-menu');
const navMenuMobile = document.querySelector('.nav-menu-mobile');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenuMobile.classList.toggle('open');
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenuMobile.classList.remove('open');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && hamburger.classList.contains('active')) {
      hamburger.classList.remove('active');
      navMenuMobile.classList.remove('open');
    }
  });
}
