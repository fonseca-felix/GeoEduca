/**
 * GeoEduca - Vulcão 3D Vanilla Conversion
 * Converts the provided React Three Fiber code into plain JavaScript with Three.js
 */

const CRATER_FLOOR = 3.95;

const PROFILE = [
  [8.8, 0], [7.3, 0.9], [5.9, 2.1], [4.7, 3.3], [3.7, 4.5], [2.9, 5.6], [2.4, 6.4],
  [2.2, 6.75], [1.95, 6.6], [1.7, 6.0], [1.5, 5.2], [1.35, 4.5], [1.25, 4.1], [0.0, 3.95]
];

function createCraggyLathe(segments = 128) {
  const pts = PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, segments);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 0.05) continue;
    
    const a = Math.atan2(v.z, v.x);
    const ridges = Math.sin(a * 7) * 0.16 +
                   Math.sin(a * 13 + 1.7) * 0.1 +
                   Math.sin(a * 3 + v.y * 0.6) * 0.22 +
                   Math.sin(v.y * 2.4 + a * 5) * 0.12;
                   
    const taper = Math.min(1, v.y / 1.6) * 0.5 + 0.5;
    const gullies = Math.sin(a * 24) * 0.05 + Math.sin(a * 40 + 0.6) * 0.03;
    const k = 1 + (ridges * 0.2 + gullies) * taper;
    
    v.x *= k;
    v.z *= k;
    v.y += Math.sin(a * 9 + r) * 0.06;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// --- GLOBAL STATE ---
let scene, camera, renderer, controls;
let isErupting = true;
let isCut = false;
let currentView = 'orbit';

const VIEWS = {
  orbit: { pos: new THREE.Vector3(17, 10, 19), target: new THREE.Vector3(0, 3.6, 0) },
  top: { pos: new THREE.Vector3(0, 32, 0.8), target: new THREE.Vector3(0, 3, 0) },
  inside: { pos: new THREE.Vector3(0, 5.1, 1.35), target: new THREE.Vector3(0, CRATER_FLOOR - 0.1, 0) },
  cut: { pos: new THREE.Vector3(0, 4, 26), target: new THREE.Vector3(0, 1, 0) },
};

// References for animation
const animRefs = {
  lavaMaterial: null,
  craterLight: null,
  cutGroup: null,
  volcanoMaterial: null,
  clipPlane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
  
  // Camera transition
  lastView: 'orbit',
  movingTime: 0,
  goalPos: new THREE.Vector3(),
  goalTarget: new THREE.Vector3(),
  
  // Eruption
  particlesMesh: null,
  smokeMesh: null,
  particlesBits: [],
  particlesPos: [],
  dummy: new THREE.Object3D()
};

const CLOCK = new THREE.Clock();

window.initVolcanoScene = function() {
  const container = document.getElementById('canvas-container');

  // 1. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true; // IMPORTANT for the cut view
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // 2. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0a0b');
  scene.fog = new THREE.Fog('#15100f', 45, 130);

  // 3. Camera & Controls
  camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.05, 300);
  camera.position.copy(VIEWS.orbit.pos);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.1;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI / 2 + 0.25;
  controls.target.copy(VIEWS.orbit.target);

  // 4. Lights
  const ambient = new THREE.AmbientLight('#a8bcd6', 0.35);
  scene.add(ambient);
  
  const hemi = new THREE.HemisphereLight('#8ea6c6', '#3a2418', 0.85);
  scene.add(hemi);
  
  const dirLight = new THREE.DirectionalLight('#ffe0bd', 2.8);
  dirLight.position.set(18, 22, 12);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // Extra Lights to simulate Drei's Lightformer environment
  const lightformerTop = new THREE.PointLight('#9fb6d2', 1.4, 50);
  lightformerTop.position.set(0, 12, 0);
  scene.add(lightformerTop);
  
  const lightformerMid = new THREE.PointLight('#ff8a4a', 0.6, 30);
  lightformerMid.position.set(0, 4, 0);
  scene.add(lightformerMid);

  // 5. Build Geometry
  buildVolcano();
  buildEruption();
  buildFloor();

  // Resize Listener
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Start Loop
  animate();
};

function buildVolcano() {
  const volcanoGroup = new THREE.Group();
  scene.add(volcanoGroup);

  // Main Mountain
  const geo = createCraggyLathe();
  const mat = new THREE.MeshStandardMaterial({
    color: '#4e453e',
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: true,
    clippingPlanes: null // Will be set to [animRefs.clipPlane] when cut=true
  });
  animRefs.volcanoMaterial = mat;
  
  const mountain = new THREE.Mesh(geo, mat);
  mountain.receiveShadow = true;
  mountain.castShadow = true;
  volcanoGroup.add(mountain);

  // Crater Lava Lake
  const craterGeo = new THREE.CircleGeometry(1.12, 48);
  const craterMat = new THREE.MeshStandardMaterial({
    color: '#ff5a12',
    emissive: '#ff7a1a',
    emissiveIntensity: 2,
    roughness: 0.4
  });
  animRefs.lavaMaterial = craterMat;
  
  const crater = new THREE.Mesh(craterGeo, craterMat);
  crater.position.set(0, CRATER_FLOOR + 0.04, 0);
  crater.rotation.x = -Math.PI / 2;
  volcanoGroup.add(crater);

  // Crater Light
  const cLight = new THREE.PointLight('#ff7a2a', 14, 14, 2);
  cLight.position.set(0, CRATER_FLOOR + 0.6, 0);
  animRefs.craterLight = cLight;
  volcanoGroup.add(cLight);

  // Cut Inner Group (Magma Chamber, Conduit)
  animRefs.cutGroup = new THREE.Group();
  animRefs.cutGroup.visible = false;
  volcanoGroup.add(animRefs.cutGroup);

  // Conduit (Cylinder)
  const conduitGeo = new THREE.CylinderGeometry(0.42, 0.78, 4.8, 20, 1, true);
  const conduitMat = new THREE.MeshStandardMaterial({
    color: '#ff4a08', emissive: '#ff6a12', emissiveIntensity: 2.2, side: THREE.DoubleSide
  });
  const conduit = new THREE.Mesh(conduitGeo, conduitMat);
  conduit.position.set(0, 1.4, 0);
  animRefs.cutGroup.add(conduit);

  // Magma Chamber (Sphere)
  const chamberGeo = new THREE.SphereGeometry(3.1, 32, 24);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: '#e03a06', emissive: '#ff5a10', emissiveIntensity: 1.6, roughness: 0.5
  });
  const chamber = new THREE.Mesh(chamberGeo, chamberMat);
  chamber.position.set(0, -1.6, 0);
  chamber.scale.set(1, 0.62, 1);
  animRefs.cutGroup.add(chamber);

  // Dikes (Small Cylinder)
  const dikeGeo = new THREE.CylinderGeometry(0.18, 0.3, 4, 12);
  const dikeMat = new THREE.MeshStandardMaterial({
    color: '#ff6a12', emissive: '#ff6a12', emissiveIntensity: 1.4
  });
  const dike = new THREE.Mesh(dikeGeo, dikeMat);
  dike.position.set(2.1, 1.2, 0);
  dike.rotation.z = -0.5;
  animRefs.cutGroup.add(dike);

  // Crust layers (Rings)
  const ringsY = [0.4, 1.6, 2.9];
  ringsY.forEach((y, i) => {
    const rGeo = new THREE.RingGeometry(0.9 + i * 0.4, 8.6 - i * 1.9, 64, 1, 0, Math.PI);
    const rMat = new THREE.MeshStandardMaterial({
      color: i % 2 ? '#5e514a' : '#3a322e',
      side: THREE.DoubleSide,
      roughness: 1
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(0, y, 0);
    rMesh.rotation.x = -Math.PI / 2;
    animRefs.cutGroup.add(rMesh);
  });
}

function buildFloor() {
  const floorGeo = new THREE.CircleGeometry(90, 64);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#241d1a', roughness: 1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);
}

function buildEruption() {
  const COUNT = 90;
  
  // Particles
  const pGeo = new THREE.IcosahedronGeometry(1, 0);
  const pMat = new THREE.MeshStandardMaterial({
    color: '#ff8a2a', emissive: '#ff6a10', emissiveIntensity: 2.6, flatShading: true
  });
  animRefs.particlesMesh = new THREE.InstancedMesh(pGeo, pMat, COUNT);
  scene.add(animRefs.particlesMesh);

  for (let i = 0; i < COUNT; i++) {
    animRefs.particlesBits.push({
      vx: 0, vy: 0, vz: 0,
      life: Math.random() * 2,
      max: 1.4 + Math.random() * 1.6,
      scale: 0.06 + Math.random() * 0.16
    });
    animRefs.particlesPos.push(new THREE.Vector3());
  }

  // Smoke
  const sGeo = new THREE.SphereGeometry(1, 10, 8);
  const sMat = new THREE.MeshStandardMaterial({
    color: '#6d6560', transparent: true, opacity: 0.18, depthWrite: false, roughness: 1
  });
  animRefs.smokeMesh = new THREE.InstancedMesh(sGeo, sMat, 22);
  scene.add(animRefs.smokeMesh);
}

function respawnParticle(b, p) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.7;
  p.set(Math.cos(a) * r, CRATER_FLOOR + 0.2, Math.sin(a) * r);
  const spread = 1.4 + Math.random() * 2.6;
  b.vx = Math.cos(a) * spread * Math.random();
  b.vz = Math.sin(a) * spread * Math.random();
  b.vy = 6 + Math.random() * 7;
  b.life = 0;
}

function updateEruption(dt, time) {
  const pMesh = animRefs.particlesMesh;
  const sMesh = animRefs.smokeMesh;
  const dummy = animRefs.dummy;

  // Update Particles
  if (pMesh) {
    for (let i = 0; i < animRefs.particlesBits.length; i++) {
      const b = animRefs.particlesBits[i];
      const p = animRefs.particlesPos[i];
      if (!isErupting) {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.001);
      } else {
        b.life += dt;
        if (b.life <= 0 || b.life > b.max) respawnParticle(b, p);
        b.vy -= 11 * dt;
        p.x += b.vx * dt;
        p.y += b.vy * dt;
        p.z += b.vz * dt;
        dummy.position.copy(p);
        dummy.scale.setScalar(b.scale * (1 - b.life / b.max / 2));
      }
      dummy.updateMatrix();
      pMesh.setMatrixAt(i, dummy.matrix);
    }
    pMesh.instanceMatrix.needsUpdate = true;
  }

  // Update Smoke
  if (sMesh) {
    for (let i = 0; i < 22; i++) {
      const f = ((time * 0.22 + i / 22) % 1);
      const h = f * 16;
      const s = isErupting ? 0.9 + f * 4.2 : 0.5 + f * 2.2;
      dummy.position.set(
        Math.sin(i * 2.3 + time * 0.4) * f * 2.6,
        CRATER_FLOOR + 0.4 + h,
        Math.cos(i * 1.7 + time * 0.35) * f * 2.6
      );
      dummy.rotation.set(0, time * 0.2 + i, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      sMesh.setMatrixAt(i, dummy.matrix);
    }
    sMesh.instanceMatrix.needsUpdate = true;
    sMesh.material.opacity = isErupting ? 0.3 : 0.13;
  }
}

function updateRig(dt) {
  if (animRefs.lastView !== currentView) {
    animRefs.lastView = currentView;
    animRefs.movingTime = 1.6;
  }

  if (animRefs.movingTime > 0 && controls) {
    animRefs.movingTime -= dt;
    const v = VIEWS[currentView];
    animRefs.goalPos.copy(v.pos);
    animRefs.goalTarget.copy(v.target);
    
    const k = 1 - Math.exp(-4 * dt);
    camera.position.lerp(animRefs.goalPos, k);
    controls.target.lerp(animRefs.goalTarget, k);
  }
  
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  const rawDelta = CLOCK.getDelta();
  const dt = Math.min(rawDelta, 0.05);
  const time = CLOCK.getElapsedTime();

  // Pulse effect
  const pulse = 1 + Math.sin(time * 1.6) * 0.18 + Math.sin(time * 4.1) * 0.06;
  if (animRefs.lavaMaterial) {
    animRefs.lavaMaterial.emissiveIntensity = (isErupting ? 3.4 : 1.9) * pulse;
  }
  if (animRefs.craterLight) {
    animRefs.craterLight.intensity = (isErupting ? 14 : 6) * pulse;
  }

  updateEruption(dt, time);
  updateRig(dt);

  renderer.render(scene, camera);
}

// Window Globals for UI integration
window.setVolcanoEruption = function(state) {
  isErupting = state;
}

window.setVolcanoView = function(viewKey, cut) {
  currentView = viewKey;
  isCut = cut;
  
  if (animRefs.volcanoMaterial) {
    animRefs.volcanoMaterial.clippingPlanes = isCut ? [animRefs.clipPlane] : null;
  }
  if (animRefs.cutGroup) {
    animRefs.cutGroup.visible = isCut;
  }
}
