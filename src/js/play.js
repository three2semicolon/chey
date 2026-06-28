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
const DRAG_FOLLOW_SPEED = 12;    // higher = snappier follow, lower = more lag/elastic feel

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
  scene.background = new THREE.Color(0x180d23);

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);
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

  const fillLight = new THREE.PointLight(0x8774ca, 0.7, 20);
  fillLight.position.set(-3, 3, 2);
  scene.add(fillLight);

  // ── ROOM ──
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x18132a, roughness: 0.85 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x3d2460, roughness: 0.95 });

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
    { pos: [0, 0, -ROOM_SIZE],     rot: [0, 0, 0] },
    { pos: [-ROOM_SIZE, 0, 0],     rot: [0, Math.PI / 2, 0] },
    { pos: [ROOM_SIZE, 0, 0],      rot: [0, -Math.PI / 2, 0] },
    { pos: [0, 0, ROOM_SIZE + 4],  rot: [0, Math.PI, 0] },
    { pos: [0, ROOM_HEIGHT, 0],    rot: [Math.PI / 2, 0, 0] },
  ];
  wallBodies.forEach(({ pos, rot }) => {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: wallMaterial });
    body.quaternion.setFromEuler(...rot);
    body.position.set(...pos);
    world.addBody(body);
  });

  // ── BALL ──
  const ballMat = new CANNON.Material('ball');

  world.addContactMaterial(new CANNON.ContactMaterial(ballMat, groundMat, {
    restitution: 0.72,
    friction: 0.5,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(ballMat, wallMaterial, {
    restitution: 0.55,
    friction: 0.3,
  }));

  ballBody = new CANNON.Body({
    mass: 0.62,
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
      new THREE.MeshStandardMaterial({ color: 0x6541a1, roughness: 0.6 })
    );
    ballMesh.castShadow = true;
  }
  scene.add(ballMesh);

  // setupSwipeThrow is called ONCE — this return value is what animate() reads from
  const dragControls = setupSwipeThrow(canvas, THREE, CANNON);
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

    if (dragControls.isDragging) {
      const current = ballBody.position;
      const beforeX = current.x, beforeY = current.y, beforeZ = current.z;

      const t = Math.min(DRAG_FOLLOW_SPEED * dt, 1);
      const target = dragControls.dragTarget;
      const newX = current.x + (target.x - current.x) * t;
      const newY = current.y + (target.y - current.y) * t;
      const newZ = current.z + (target.z - current.z) * t;

      ballBody.position.set(newX, newY, newZ);

      // velocity sampled from actual eased movement, not raw pointer delta
      dragControls.velocitySample.set(
        (newX - beforeX) / dt,
        (newY - beforeY) / dt,
        (newZ - beforeZ) / dt
      );

      // tumble the ball as it's dragged — spin proportional to movement speed
      const spin = dragControls.velocitySample;
      const q = new CANNON.Quaternion();
      q.setFromEuler(spin.z * dt * 0.6, spin.x * dt * 0.6, -spin.y * dt * 0.6 + spin.x * dt * 0.2);
      ballBody.quaternion = ballBody.quaternion.mult(q);
    } else {
      world.step(1 / 60, dt, 3);
    }

    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }
  animate();
}

// ── DRAG-TO-THROW ──────────────────────────────────
function setupSwipeThrow(canvas, THREE, CANNON) {
  let isDragging = false;
  const dragTarget     = new THREE.Vector3();
  const velocitySample = new THREE.Vector3();

  const raycaster   = new THREE.Raycaster();
  const pointer     = new THREE.Vector2();
  const dragPlane   = new THREE.Plane();
  const planeNormal = new THREE.Vector3();
  const intersection = new THREE.Vector3();

  function getNDC(e, rect) {
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    pointer.set(x * 2 - 1, -(y * 2 - 1));
  }

  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    getNDC(e, rect);
    raycaster.setFromCamera(pointer, camera);

    const ballPos = new THREE.Vector3().copy(ballBody.position);
    const closest = new THREE.Vector3();
    raycaster.ray.closestPointToPoint(ballPos, closest);

    if (closest.distanceTo(ballPos) > BALL_RADIUS * 2) return;

    isDragging = true;
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.type = CANNON.Body.KINEMATIC;

    camera.getWorldDirection(planeNormal);
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, ballPos);

    dragTarget.copy(ballPos);
    velocitySample.set(0, 0, 0);

    canvas.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    getNDC(e, rect);
    raycaster.setFromCamera(pointer, camera);

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      intersection.x = Math.max(-ROOM_SIZE + BALL_RADIUS, Math.min(ROOM_SIZE - BALL_RADIUS, intersection.x));
      intersection.y = Math.max(BALL_RADIUS, Math.min(ROOM_HEIGHT - BALL_RADIUS, intersection.y));
      intersection.z = Math.max(-ROOM_SIZE + BALL_RADIUS, Math.min(ROOM_SIZE - BALL_RADIUS, intersection.z));

      dragTarget.copy(intersection);
    }
  }

  function onUp(e) {
    if (!isDragging) return;
    isDragging = false;
    ballBody.type = CANNON.Body.DYNAMIC;
    ballBody.wakeUp();

    const speed = velocitySample.length();
    const maxThrow = 40;
    const power = Math.min(speed, maxThrow);

    const forwardBoost = Math.max(power * 0.6, 2);

    ballBody.velocity.set(
      velocitySample.x,
      velocitySample.y,
      -forwardBoost
    );

    ballBody.angularVelocity.set(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );

    if (power > 0.5) markThrown();
    canvas.releasePointerCapture(e.pointerId);
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  return {
    get isDragging() { return isDragging; },
    dragTarget,
    velocitySample,
  };
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