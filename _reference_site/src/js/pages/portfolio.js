/**
 * portfolio.js
 * Renders masonry gallery + lightbox.
 * Fetches from Sanity CMS when configured; falls back to local images.
 *
 * ── SANITY SETUP ──
 * 1. Run: npm create sanity@latest  (or: npm install @sanity/client)
 * 2. Fill in your projectId and dataset below
 * 3. Deploy CORS origin for your site in Sanity manage dashboard
 * 4. Images tagged in Sanity will auto-appear here
 */

// ── SANITY CONFIG ─────────────────────────────────
const SANITY_CONFIG = {
  projectId: 'YOUR_PROJECT_ID',   // ← replace
  dataset:   'production',
  apiVersion: '2024-01-01',
  useCdn: true,
};

// ── LOCAL FALLBACK IMAGES ─────────────────────────
// Used when Sanity is not yet configured.
// Format: { src, title, category, description }
const LOCAL_IMAGES = [
  // { src: 'public/img/photo1.jpg', title: 'Golden Hour', category: 'portraits', description: '' },
];

// ── SANITY GROQ QUERY ─────────────────────────────
const QUERY = encodeURIComponent(`
  *[_type == "photo"] | order(publishedAt desc) {
    _id,
    title,
    category,
    description,
    "src": image.asset->url,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
  }
`);

// ─────────────────────────────────────────────────

const Portfolio = (() => {
  let allImages = [];
  let filtered  = [];
  let currentLightboxIndex = 0;

  // ── Fetch from Sanity ──
  async function fetchFromSanity() {
    const { projectId, dataset, apiVersion, useCdn } = SANITY_CONFIG;
    if (projectId === 'YOUR_PROJECT_ID') return null;

    const host = useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
    const url  = `https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?query=${QUERY}`;

    try {
      const res  = await fetch(url);
      const data = await res.json();
      return data.result || [];
    } catch (err) {
      console.warn('Sanity fetch failed, using local fallback:', err);
      return null;
    }
  }

  // ── Normalise image objects ──
  function normalise(items) {
    return items.map(item => ({
      id:          item._id || Math.random().toString(36).slice(2),
      src:         item.src || item.url || '',
      title:       item.title || '',
      category:    (item.category || 'all').toLowerCase(),
      description: item.description || '',
    }));
  }

  // ── Build filter buttons ──
  function buildFilters(images) {
    const wrap = document.querySelector('.portfolio-filters');
    if (!wrap) return;

    const cats = ['all', ...new Set(images.map(i => i.category).filter(Boolean))];

    wrap.innerHTML = '';
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (cat === 'all' ? ' active' : '');
      btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      btn.dataset.cat = cat;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterGallery(cat);
      });
      wrap.appendChild(btn);
    });
  }

  // ── Filter gallery ──
  function filterGallery(cat) {
    filtered = cat === 'all' ? allImages : allImages.filter(i => i.category === cat);
    renderGallery(filtered);
  }

  // ── Render masonry grid ──
  function renderGallery(images) {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    if (images.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <p>No images yet. Add photos in Sanity Studio or drop files into LOCAL_IMAGES in portfolio.js.</p>
        </div>`;
      return;
    }

    grid.innerHTML = '';
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = idx;

      item.innerHTML = `
        <img src="${img.src}" alt="${img.title}" loading="lazy" />
        <div class="gallery-item-overlay">
          <div class="gallery-item-meta">
            <h4>${img.title}</h4>
            ${img.category ? `<p>${img.category}</p>` : ''}
          </div>
        </div>`;

      item.addEventListener('click', () => openLightbox(idx));
      grid.appendChild(item);
    });
  }

  // ── Lightbox ──
  function openLightbox(index) {
    currentLightboxIndex = index;
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    updateLightboxContent();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const img  = filtered[currentLightboxIndex];
    if (!img) return;

    const lbImg  = document.querySelector('#lightbox .lb-image');
    const lbTitle = document.querySelector('#lightbox .lb-title');
    const lbCat  = document.querySelector('#lightbox .lb-category');
    const lbDesc = document.querySelector('#lightbox .lb-desc');

    if (lbImg)   lbImg.src = img.src;
    if (lbTitle) lbTitle.textContent = img.title;
    if (lbCat)   lbCat.textContent  = img.category;
    if (lbDesc)  lbDesc.textContent = img.description;
  }

  function navigate(dir) {
    currentLightboxIndex = (currentLightboxIndex + dir + filtered.length) % filtered.length;
    updateLightboxContent();
  }

  function bindLightboxEvents() {
    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-nav.prev')?.addEventListener('click', () => navigate(-1));
    document.querySelector('.lightbox-nav.next')?.addEventListener('click', () => navigate(1));

    document.getElementById('lightbox')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeLightbox();
    });

    document.addEventListener('keydown', e => {
      const lb = document.getElementById('lightbox');
      if (!lb?.classList.contains('open')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   navigate(-1);
      if (e.key === 'ArrowRight')  navigate(1);
    });
  }

  // ── Init ──
  async function init() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<div class="gallery-loading">Loading images…</div>';

    // Try Sanity first, fall back to local
    const sanityImages = await fetchFromSanity();
    const raw = sanityImages ?? LOCAL_IMAGES;

    allImages = normalise(raw);
    filtered  = allImages;

    buildFilters(allImages);
    renderGallery(allImages);
    bindLightboxEvents();
  }

  return { init };
})();

export default Portfolio;