/**
 * reel.js
 * Builds and animates the film reel strip.
 *
 * Usage:
 *   import Reel from './reel.js';
 *   Reel.init({
 *     images: [
 *       { src: 'public/img/photo1.jpg', alt: 'Studio shoot' },
 *       { src: 'public/img/photo2.jpg', alt: 'Outdoor portrait' },
 *     ],
 *     speed: 35,   // seconds to scroll through one full set (default 35)
 *   });
 */

const Reel = (() => {

  const FRAME_W  = 154; // px including border
  const MIN_FRAMES = 10; // minimum frames to show

  function makePerfRow(frameCount) {
    const row = document.createElement('div');
    row.className = 'reel-perfs';

    // We repeat holes across the total width of all frames
    // Each frame gets 2 holes in the perf row for proper film look
    const holeCount = frameCount * 2 + 2;
    const inner = document.createElement('div');
    inner.className = 'reel-perfs-inner';
    for (let i = 0; i < holeCount; i++) {
      const hole = document.createElement('div');
      hole.className = 'reel-hole';
      inner.appendChild(hole);
    }
    row.appendChild(inner);
    return row;
  }

  function makeFrameRow(images) {
    const row = document.createElement('div');
    row.className = 'reel-frames';

    images.forEach(imgData => {
      const frame = document.createElement('div');
      frame.className = 'reel-frame';

      if (imgData && imgData.src) {
        const img = document.createElement('img');
        img.src   = imgData.src;
        img.alt   = imgData.alt || '';
        img.loading = 'lazy';
        frame.appendChild(img);
      } else {
        // placeholder
        const ph = document.createElement('div');
        ph.className = 'reel-placeholder';
        ph.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>`;
        frame.appendChild(ph);
      }

      row.appendChild(frame);
    });

    return row;
  }

  function buildHalf(images) {
    const half = document.createElement('div');
    half.className = 'reel-half';

    half.appendChild(makePerfRow(images.length));
    half.appendChild(makeFrameRow(images));
    half.appendChild(makePerfRow(images.length));

    return half;
  }

  function init({ images = [], speed = 35 } = {}) {
    const strip = document.getElementById('reel-strip');
    if (!strip) return;

    // Pad to minimum
    const paddedImages = [...images];
    while (paddedImages.length < MIN_FRAMES) {
      paddedImages.push(null); // null = placeholder
    }

    // Build two halves for seamless loop
    strip.appendChild(buildHalf(paddedImages));
    strip.appendChild(buildHalf(paddedImages));

    // Set animation duration proportional to content
    const totalW  = FRAME_W * paddedImages.length;
    const duration = Math.max(20, (totalW / 300) * (speed / 4));
    strip.style.animation = `reel-scroll ${duration}s linear infinite`;
  }

  return { init };
})();

export default Reel;