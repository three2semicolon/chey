/* home page */

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

  function makeFrames(images) {
    const row = document.createElement('div');
    row.className = 'reel-frames';
    images.forEach(src => {
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

  // Hole count = 2 per frame so they span the full width
  const holeCount = REEL_IMAGES.length * 2;

  // Build two identical halves for seamless loop
  for (let i = 0; i < 2; i++) {
    const half = document.createElement('div');
    half.className = 'reel-half';
    half.appendChild(makeHoles(holeCount));
    half.appendChild(makeFrames(REEL_IMAGES));
    half.appendChild(makeHoles(holeCount));
    strip.appendChild(half);
  }
}

export { buildReel };
