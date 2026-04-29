/**
 * hero.js
 * Scroll-driven circle rotation for the hero section.
 *
 * - .c-orbit  → rotates FORWARD with scroll (faster)
 * - .c-solid  → rotates BACKWARD with scroll (slower, opposite direction)
 * - .c-inner-ring → rotates FORWARD slowly (autonomous slow drift)
 *
 * Both also have a gentle idle drift animation when not scrolling.
 */

const Hero = (() => {
  let orbitEl, solidEl, innerRingEl;

  // Accumulated rotation angles
  let orbitAngle     = 0;
  let solidAngle     = 0;
  let innerRingAngle = 0;

  // For idle drift
  let lastScrollY    = 0;
  let lastScrollTime = 0;
  let idleTimer      = null;
  let idleRAF        = null;
  let idleRunning    = false;

  const ORBIT_SPEED      =  0.18;  // deg per scroll pixel (forward)
  const SOLID_SPEED      = -0.09;  // deg per scroll pixel (backward, slower)
  const INNER_SPEED      =  0.06;  // deg per scroll pixel (forward, slowest)
  const IDLE_ORBIT_SPEED =  0.04;  // deg per frame idle drift
  const IDLE_SOLID_SPEED = -0.02;

  function applyRotations() {
    if (orbitEl)     orbitEl.style.transform     = `rotate(${orbitAngle}deg)`;
    if (solidEl)     solidEl.style.transform      = `rotate(${solidAngle}deg)`;
    if (innerRingEl) innerRingEl.style.transform  = `rotate(${innerRingAngle}deg)`;
  }

  function onScroll() {
    const current = window.scrollY;
    const delta   = current - lastScrollY;
    lastScrollY   = current;
    lastScrollTime = Date.now();

    orbitAngle     += delta * ORBIT_SPEED;
    solidAngle     += delta * SOLID_SPEED;
    innerRingAngle += delta * INNER_SPEED;

    applyRotations();

    // Stop idle drift while scrolling
    stopIdle();

    // Restart idle after 800ms of no scroll
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdle, 800);
  }

  function idleTick() {
    orbitAngle     += IDLE_ORBIT_SPEED;
    solidAngle     += IDLE_SOLID_SPEED;
    innerRingAngle += IDLE_ORBIT_SPEED * 0.5;
    applyRotations();
    idleRAF = requestAnimationFrame(idleTick);
  }

  function startIdle() {
    if (idleRunning) return;
    idleRunning = true;
    idleRAF = requestAnimationFrame(idleTick);
  }

  function stopIdle() {
    if (!idleRunning) return;
    idleRunning = false;
    cancelAnimationFrame(idleRAF);
  }

  function init() {
    orbitEl     = document.querySelector('.c-orbit');
    solidEl     = document.querySelector('.c-solid');
    innerRingEl = document.querySelector('.c-inner-ring');

    if (!orbitEl) return; // hero not present

    window.addEventListener('scroll', onScroll, { passive: true });
    startIdle(); // kick off gentle drift immediately
  }

  return { init };
})();

export default Hero;