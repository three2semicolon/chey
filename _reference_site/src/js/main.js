/**
 * main.js
 * Entry point — wires up router, reel, hero, and page-specific modules.
 */

import Router    from './router.js';
import Reel      from './reel.js';
import Hero      from './hero.js';
import Portfolio from './pages/portfolio.js';

// ── REEL IMAGES ────────────────────────────────────────────
// Add your photo paths here. They'll scroll across the film reel.
const REEL_IMAGES = [
  // { src: 'public/img/photo1.jpg', alt: 'Studio session' },
  // { src: 'public/img/photo2.jpg', alt: 'Outdoor portrait' },
  // { src: 'public/img/photo3.jpg', alt: 'Wedding day' },
];

// ── CAMERAS ────────────────────────────────────────────────
// Edit this list to reflect your actual gear.
const CAMERAS = [
  { name: 'Sony A7 IV',     type: 'Primary Body' },
  { name: 'Canon 5D Mk IV', type: 'Secondary Body' },
  { name: '85mm f/1.4',     type: 'Portrait Lens' },
  { name: '35mm f/1.8',     type: 'Walk-around Lens' },
];

// ── SKILLS ─────────────────────────────────────────────────
// Lucide-style SVG paths for each skill icon
const SKILLS = [
  {
    name: 'Portraits',
    desc: 'Authentic, expressive portraits that capture personality and emotion.',
    icon: `<polyline points="2 12 7 12"/><polyline points="17 12 22 12"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/><circle cx="12" cy="12" r="4"/>`,
  },
  {
    name: 'Landscapes',
    desc: 'Sweeping natural scenes shot with patience and a careful eye.',
    icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/><path d="m3 15 4-4 4 4 4-4 4 4"/>`,
  },
  {
    name: 'Commercial / Corporate',
    desc: 'Clean, professional imagery that elevates brands and teams.',
    icon: `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>`,
  },
  {
    name: 'Weddings',
    desc: 'Timeless storytelling for one of life\'s most important days.',
    icon: `<circle cx="9" cy="9" r="4"/><circle cx="15" cy="9" r="4"/><path d="M12 17c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/>`,
  },
];

// ──────────────────────────────────────────────────────────

function buildCameras() {
  const strip = document.querySelector('.cameras-strip');
  if (!strip) return;

  CAMERAS.forEach(cam => {
    const card = document.createElement('div');
    card.className = 'camera-card';
    card.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              stroke="none" fill="currentColor"/>
      </svg>
      <div>
        <span style="display:block;font-size:0.78rem;font-weight:500;color:var(--white)">${cam.name}</span>
        <span style="display:block;font-size:0.65rem;color:var(--muted);margin-top:0.15rem">${cam.type}</span>
      </div>`;
    strip.appendChild(card);
  });
}

function buildSkills() {
  const grid = document.querySelector('.skill-grid');
  if (!grid) return;

  SKILLS.forEach(skill => {
    const item = document.createElement('div');
    item.className = 'skill-item';
    item.innerHTML = `
      <div class="skill-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${skill.icon}</svg>
      </div>
      <h4>${skill.name}</h4>
      <p>${skill.desc}</p>`;
    grid.appendChild(item);
  });
}

// ── INIT ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Start router (sets up navigation + initial page)
  Router.init();

  // Init hero circle scroll interaction
  Hero.init();

  // Build reel
  Reel.init({ images: REEL_IMAGES, speed: 35 });

  // Build static home content
  buildCameras();
  buildSkills();

  // Init portfolio on first visit to that page
  let portfolioInited = false;
  document.addEventListener('pageChanged', ({ detail }) => {
    if (detail.page === 'portfolio' && !portfolioInited) {
      portfolioInited = true;
      Portfolio.init();
    }
  });
});