// sanity config
const SANITY = {
  projectId: '76kejomt',
  dataset:   'live',
  apiVersion: '2024-01-01',
};

// local fallback data (if sanity fetch fails)
const LOCAL_IMAGES = [
  {
    id: '1', featured: true,  order: 1,
    title: 'Golden Hour',     category: 'portraits',
    description: 'Shot on location at sunset.',
    src: 'public/img/test_images/placeholder.png',
  },
  {
    id: '2', featured: true,  order: 2,
    title: 'Ceremony',        category: 'weddings',
    description: '',
    src: 'public/img/test_images/placeholder.png',
  },
  {
    id: '3', featured: false, order: 3,
    title: 'Brand Shoot',     category: 'commercial',
    description: '',
    src: 'public/img/test_images/placeholder.png',
  },
  {
    id: '4', featured: false, order: 4,
    title: 'Mountain Light',  category: 'landscapes',
    description: '',
    src: 'public/img/test_images/placeholder.png',
  },
  {
    id: '5', featured: false, order: 5,
    title: 'Studio Session',  category: 'portraits',
    description: '',
    src: 'public/img/test_images/placeholder.png',
  },
  {
    id: '6', featured: false, order: 6,
    title: 'First Dance',     category: 'weddings',
    description: '',
    src: 'public/img/test_images/placeholder.png',
  },
];

// sanity fetch
async function fetchFromSanity() {
  if (SANITY.projectId === 'xxx') return null;

  const query = encodeURIComponent(`
    *[_type == "photo"] | order(order asc) {
      "id": _id,
      title,
      category,
      description,
      featured,
      order,
      "src": image.asset->url,
    }
  `);

  try {
    const url  = `https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}?query=${query}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.result || [];
  } catch (err) {
    console.warn('Sanity fetch failed, using local fallback:', err);
    return null;
  }
}

// state vars
let allImages    = [];
let filtered     = [];
let activeFilter = 'all';
let lightboxIndex = 0;

// filters
function buildFilters(images) {
  const wrap = document.getElementById('portfolio-filters');
  if (!wrap) return;

  const cats = ['all', ...new Set(images.map(i => i.category).filter(Boolean))];

  wrap.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'filter-btn' + (cat === 'all' ? ' active' : '');
    btn.textContent = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = cat;
      filtered = cat === 'all'
        ? allImages
        : allImages.filter(i => i.category === cat);
      renderGallery(filtered);
    });
    wrap.appendChild(btn);
  });
}

// featured
function renderFeatured(images) {
  const strip = document.getElementById('featured-strip');
  const grid  = document.getElementById('featured-grid');
  if (!strip || !grid) return;

  const featured = images.filter(i => i.featured);
  if (featured.length === 0) return;

  strip.style.display = 'block';
  grid.innerHTML = '';

  featured.forEach(img => {
    const item = document.createElement('div');
    item.className = 'featured-item';
    item.innerHTML = `<img src="${img.src}" alt="${img.title}" loading="lazy">
                      <div class="featured-overlay"><span>${img.title}</span></div>`;
    item.addEventListener('click', () => {
      // find index in full filtered list
      const idx = filtered.findIndex(i => i.id === img.id);
      if (idx > -1) openLightbox(idx);
    });
    grid.appendChild(item);
  });
}

// gallery
function renderGallery(images) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (images.length === 0) {
    grid.innerHTML = '<p class="gallery-empty">No images in this category yet.</p>';
    return;
  }

  grid.innerHTML = '';
  images.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${img.src}" alt="${img.title}" loading="lazy">
      <div class="gallery-overlay">
        <span class="gallery-overlay-title">${img.title}</span>
        ${img.category ? `<span class="gallery-overlay-cat">${img.category}</span>` : ''}
      </div>`;
    item.addEventListener('click', () => openLightbox(idx));
    grid.appendChild(item);
  });
}

// lightbox
function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + filtered.length) % filtered.length;
  updateLightbox();
}

function updateLightbox() {
  const img = filtered[lightboxIndex];
  if (!img) return;

  const el = document.getElementById('lightbox');
  el.querySelector('.lightbox-img').src          = img.src;
  el.querySelector('.lightbox-img').alt          = img.title;
  el.querySelector('.lightbox-title').textContent = img.title;
  el.querySelector('.lightbox-category').textContent = img.category || '';
  el.querySelector('.lightbox-desc').textContent  = img.description || '';
}

function bindLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.querySelector('.lightbox-close')
    .addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox-backdrop')
    .addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox-prev')
    .addEventListener('click', () => navigateLightbox(-1));
  lb.querySelector('.lightbox-next')
    .addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
    if (e.key === 'ArrowRight')  navigateLightbox(1);
  });
}

// init
async function setupPortfolio() {
  bindLightbox();

  const sanityData = await fetchFromSanity();
  allImages = sanityData ?? LOCAL_IMAGES;
  filtered  = allImages;

  buildFilters(allImages);
  renderFeatured(allImages);
  renderGallery(allImages);
}

export { setupPortfolio };