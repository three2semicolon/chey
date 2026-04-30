const REEL_IMAGES = [
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
];

const BASE_SPEED  = 0.6;   // px per frame
const FRICTION    = 0.94;
const MAX_SPEED   =  BASE_SPEED * 40;
const HOLE_W      = 34;    // hole + gap width
const REEL_IMAGE_W = 300;

function buildReel() {
  const strip = document.getElementById('reel-strip');
  if (!strip) return;

  function makeHoles(count) {
    const row = document.createElement('div');
    row.className = 'reel-perfs';
    for (let i = 0; i < count; i++) {
      const h = document.createElement('div');
      h.className = 'reel-hole';
      row.appendChild(h);
    }
    return row;
  }

  function makeFrames() {
    const row = document.createElement('div');
    row.className = 'reel-frames';
    REEL_IMAGES.forEach(src => {
      const frame = document.createElement('div');
      frame.className = 'reel-frame';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      frame.appendChild(img);
      row.appendChild(frame);
    });
    return row;
  }

  // two halves
  for (let i = 0; i < 2; i++) {
    const half = document.createElement('div');
    half.className = 'reel-half';

    const frames = makeFrames();

    const totalFramesW = (REEL_IMAGE_W + 12) * REEL_IMAGES.length;
    const holeCount    = Math.ceil(totalFramesW / HOLE_W) + 1;

    half.appendChild(makeHoles(holeCount));
    half.appendChild(frames);
    half.appendChild(makeHoles(holeCount));
    strip.appendChild(half);
  }

  requestAnimationFrame(() => requestAnimationFrame(() => initPhysics(strip)));
}

// physics loop
function initPhysics(strip) {
  const half      = strip.querySelector('.reel-half');
  const halfW     = half.getBoundingClientRect().width;

  let offset      = 0;
  let velocity    = -BASE_SPEED;
  let isDragging  = false;
  let dragStartX  = 0;
  let lastDragX   = 0;
  let lastDragT   = 0;
  let dragVel     = 0;

  function tick() {
    if (!isDragging) {
      if (Math.abs(velocity) > BASE_SPEED * 1.5) {
        velocity *= FRICTION;
      } else {
        velocity += (-BASE_SPEED - velocity) * 0.03;
      }
    }

    offset += velocity;

    offset = ((offset % halfW) - halfW) % halfW;

    strip.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(tick);
  }

  // pointers
  function onDragStart(x) {
    isDragging = true;
    dragStartX = x;
    lastDragX  = x;
    lastDragT  = performance.now();
    dragVel    = 0;
    velocity   = 0;
    strip.style.cursor = 'grabbing';
  }

  function onDragMove(x) {
    if (!isDragging) return;
    const now   = performance.now();
    const dt    = now - lastDragT || 1;
    const dx    = x - lastDragX;

    dragVel    = (dx / dt) * 16;
    offset    += dx;
    offset    = ((offset % halfW) - halfW) % halfW;
    lastDragX  = x;
    lastDragT  = now;

    strip.style.transform = `translateX(${offset}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    strip.style.cursor = 'grab';
    velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dragVel));
  }

  // mouse
  strip.addEventListener('mousedown',  e => onDragStart(e.clientX));
  window.addEventListener('mousemove', e => onDragMove(e.clientX));
  window.addEventListener('mouseup',   onDragEnd);

  // touch
  strip.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove',  e => onDragMove(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend',   onDragEnd);

  strip.style.cursor = 'grab';
  tick();
}

export { buildReel };