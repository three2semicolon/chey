/* basketball easter egg */

let scene, camera, renderer, world, ballBody, ballMesh;
let animationId = null;
let resizeHandler = null;
let idleCheckInterval = null;

const BALL_RADIUS   = 0.55;
const ROOM_SIZE     = 5;
const ROOM_HEIGHT   = 6;
const BALL_START    = { x: 0, y: 1.6, z: 3.5 }; // close to camera

const IDLE_RESET_MS    = 2000;   // reset this long after ball settles
const MAX_AIRBORNE_MS  = 5000;   // hard reset if ball never settles (prevents lock-up)
const VELOCITY_SETTLE_THRESHOLD = 0.15;

async function initPlay() {
  const canvas  = document.getElementById('play-canvas');
  const loading = document.getElementById('play-loading');
  if (!canvas) return;

  const [THREE, CANNON, { GLTFLoader }] = await Promise.all([
    import('https://esm.sh/three@0.160.0'),
    import('https://esm.sh/cannon-es@0.20.0'),
    import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js'),
  ]);

  const wrap   = canvas.parentElement;
  const width  = wrap.clientWidth;
  const height = wrap.clientHeight;

  // ── SCENE ──────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100d1a);

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2); // closer + slightly above
  camera.lookAt(0, 1.2, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // ── LIGHTING ───────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(4, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x8b5ec7, 0.7, 20);
  fillLight.position.set(-3, 3, 2);
  scene.add(fillLight);

  // ── ROOM — brighter walls, clear separation from floor ──
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x241c3d, roughness: 0.85 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x352a52, roughness: 0.95 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_SIZE * 2), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_HEIGHT * 2), wallMat);
  backWall.position.set(0, ROOM_HEIGHT - 2, -ROOM_SIZE);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_HEIGHT * 2), wallMat.clone());
  leftWall.position.set(-ROOM_SIZE, ROOM_HEIGHT - 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_HEIGHT * 2), wallMat.clone());
  rightWall.position.set(ROOM_SIZE, ROOM_HEIGHT - 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_SIZE * 2), wallMat.clone());
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM_HEIGHT, 0);
  scene.add(ceiling);

  // ── PHYSICS WORLD ──────────────────────────────
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

  const groundMat = new CANNON.Material('ground');
  const groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: groundMat });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  const wallMaterial = new CANNON.Material('wall');
  const wallBodies = [
    { pos: [0, 0, -ROOM_SIZE],  rot: [0, 0, 0] },
    { pos: [-ROOM_SIZE, 0, 0],  rot: [0, Math.PI / 2, 0] },
    { pos: [ROOM_SIZE, 0, 0],   rot: [0, -Math.PI / 2, 0] },
    { pos: [0, 0, ROOM_SIZE + 4], rot: [0, Math.PI, 0] }, // front, keeps ball in view
    { pos: [0, ROOM_HEIGHT, 0],    rot: [Math.PI / 2, 0, 0] }, //ceiling
  ];
  wallBodies.forEach(({ pos, rot }) => {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: wallMaterial });
    body.quaternion.setFromEuler(...rot);
    body.position.set(...pos);
    world.addBody(body);
  });

  // ── BALL — real basketball bounce feel ──────────
  const ballMat = new CANNON.Material('ball');

  // Basketball bounce: ~70-75% restitution off hard floor, less off walls
  world.addContactMaterial(new CANNON.ContactMaterial(ballMat, groundMat, {
    restitution: 0.72,
    friction: 0.5,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(ballMat, wallMaterial, {
    restitution: 0.55,
    friction: 0.3,
  }));

  ballBody = new CANNON.Body({
    mass: 0.62, // ~regulation basketball mass in kg
    shape: new CANNON.Sphere(BALL_RADIUS),
    material: ballMat,
    linearDamping: 0.05,
    angularDamping: 0.4,
  });
  ballBody.position.set(BALL_START.x, BALL_START.y, BALL_START.z);
  ballBody.quaternion.copy(randomQuaternion(CANNON));
  world.addBody(ballBody);

  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('public/models/basketball.glb');
    ballMesh = gltf.scene;
    ballMesh.traverse(child => {
      if (child.isMesh && child.material.map) {
        child.material.map.wrapS = THREE.ClampToEdgeWrapping;
        child.material.map.wrapT = THREE.ClampToEdgeWrapping;
        child.material.map.needsUpdate = true;
        child.material.map.generateMipmaps = false;
        child.material.map.minFilter = THREE.LinearFilter;
      }
    });
    const box = new THREE.Box3().setFromObject(ballMesh);
    const size = box.getSize(new THREE.Vector3());
    const scale = (BALL_RADIUS * 2) / Math.max(size.x, size.y, size.z);
    ballMesh.scale.setScalar(scale);
  } catch (err) {
    console.warn('Basketball model failed, using placeholder sphere:', err);
    ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x6b3fa0, roughness: 0.6 })
    );
    ballMesh.castShadow = true;
  }
  scene.add(ballMesh);

  setupSwipeThrow(canvas, THREE, CANNON);
  setupResetButton(CANNON);
  startIdleWatcher(CANNON);

  resizeHandler = () => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resizeHandler);

  loading.classList.add('hidden');

  const clock = new THREE.Clock();
  function animate() {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    world.step(1 / 60, dt, 3);
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }
  animate();
}

// ── SWIPE-TO-THROW ──────────────────────────────────
function setupSwipeThrow(canvas, THREE, CANNON) {
  let startX = 0, startY = 0, startT = 0;
  let tracking = false;

  function onDown(e) {
    const p = getPoint(e);
    startX = p.x; startY = p.y; startT = performance.now();
    tracking = true;
  }

  function onUp(e) {
    if (!tracking) return;
    tracking = false;

    const p = getPoint(e);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const dt = Math.max(performance.now() - startT, 1);

    // tiny taps
    const dist = Math.hypot(dx, dy);
    if (dist < 15) return;

    // Speed of swipe in px/ms → normalized throw power
    const speed = dist / dt; // px per ms
    const power = Math.min(speed * 16, 14); // clamp max power

    const dirX =  (dx / dist);
    const dirY = -(dy / dist); // swipe up (negative dy) = positive y throw

    const vx = dirX * power * 0.8;
    const vy = Math.max(dirY, 0.15) * power * 0.9 + 1; // always some upward arc
    const vz = -power * 1.1; // always throws away from camera

    ballBody.wakeUp();
    ballBody.velocity.set(vx, vy, vz);
    ballBody.angularVelocity.set(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );

    markThrown();
  }

  function getPoint(e) {
    if (e.changedTouches && e.changedTouches[0]) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup',   onUp);
  canvas.addEventListener('pointercancel', onUp);
}

// ── RESET LOGIC ──────────────────────────────────────
let thrownAt = null;

function markThrown() {
  thrownAt = performance.now();
}

function resetBall(CANNON) {
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);
  ballBody.position.set(BALL_START.x, BALL_START.y, BALL_START.z);
  ballBody.quaternion.copy(randomQuaternion(CANNON));
  thrownAt = null;
}

function setupResetButton(CANNON) {
  const btn = document.getElementById('play-reset-btn');
  if (!btn) return;
  btn.addEventListener('click', () => resetBall(CANNON));
}

// Watches for: (a) ball has settled and been idle a bit, or
// (b) ball has been in motion too long without settling — force reset either way.
function startIdleWatcher(CANNON) {
  let settledSince = null;

  idleCheckInterval = setInterval(() => {
    if (!ballBody || thrownAt === null) return;

    const speed = ballBody.velocity.length();
    const now   = performance.now();

    if (speed < VELOCITY_SETTLE_THRESHOLD) {
      if (settledSince === null) settledSince = now;
      if (now - settledSince > IDLE_RESET_MS) {
        resetBall(CANNON);
        settledSince = null;
      }
    } else {
      settledSince = null;
      // Safety net: force-reset if it's been bouncing/rolling forever
      if (now - thrownAt > MAX_AIRBORNE_MS) {
        resetBall(CANNON);
      }
    }
  }, 300);
}

function randomQuaternion(CANNON) {
  const q = new CANNON.Quaternion();
  q.setFromEuler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );
  return q;
}

// ── CLEANUP ──────────────────────────────────────────
function teardownPlay() {
  if (animationId) cancelAnimationFrame(animationId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  if (idleCheckInterval) clearInterval(idleCheckInterval);
  if (renderer) renderer.dispose();
  scene = camera = renderer = world = ballBody = ballMesh = null;
  thrownAt = null;
}

export { initPlay, teardownPlay };