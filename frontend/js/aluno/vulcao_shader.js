/**
 * GeoEduca - Vulcão 3D Shaders (Three.js)
 * Procedural generation of a volcano using WebGL.
 */

// --- GLSL SHADERS ---

// 1. Vertex Shader: Displaces vertices to create a rugged mountain/volcano shape
const volcanoVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;

  // Generic 3D Simplex noise function for rugged terrain
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m; return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vPosition = position;
    
    // Calculate noise based on position
    float noise1 = snoise(position * 3.0 + uTime * 0.1) * 0.1;
    float noise2 = snoise(position * 10.0) * 0.05;
    
    // Flatten the top to create a crater
    float topFlatten = smoothstep(0.8, 1.0, position.y);
    
    // Displace the vertex
    vec3 displacedPosition = position;
    
    // Push vertices outwards based on noise to make it rugged, except at the crater lip
    float displacement = (noise1 + noise2);
    
    // Sink the center of the top to make the crater hole
    if(position.y > 0.8 && length(position.xz) < 0.4) {
       displacedPosition.y -= (0.4 - length(position.xz)) * 1.5;
    }
    
    displacedPosition += normal * displacement;
    
    vElevation = displacement + position.y;

    vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
  }
`;

// 2. Fragment Shader: Colors the volcano with rock and pulsing lava
const volcanoFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;

  void main() {
    // Base Rock Color (dark grey/brown)
    vec3 rockColor = vec3(0.1, 0.08, 0.08);
    
    // Lava Color (bright orange/red)
    vec3 lavaColor = vec3(1.0, 0.3, 0.0);
    vec3 hotLavaColor = vec3(1.0, 0.8, 0.1); // yellow hot center
    
    // Determine where lava is based on elevation/noise and height
    // We want lava in the deep cracks (low displacement) and at the crater (high Y)
    
    float isCrater = smoothstep(0.85, 0.95, vPosition.y);
    
    // Veins of lava going down
    float veins = sin(vPosition.x * 20.0 + uTime) * sin(vPosition.z * 20.0 + uTime);
    veins = smoothstep(0.8, 1.0, veins); // sharply define cracks
    
    // If it's a deep crack, it's lava. If it's the crater, it's lava.
    float lavaIntensity = veins * smoothstep(0.0, 0.8, vPosition.y) + isCrater;
    
    // Pulsing effect
    lavaIntensity *= 0.8 + 0.2 * sin(uTime * 2.0);
    
    // Mix rock and lava
    vec3 finalColor = mix(rockColor, lavaColor, clamp(lavaIntensity, 0.0, 1.0));
    
    // Add white/yellow hot center to lava
    if(lavaIntensity > 0.8) {
       finalColor = mix(finalColor, hotLavaColor, (lavaIntensity - 0.8) * 5.0);
    }
    
    // Add some darkness near the bottom to fade it into the background
    float fadeOut = smoothstep(-1.0, -0.5, vPosition.y);
    finalColor *= fadeOut;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --- THREE.JS LOGIC ---
let scene, camera, renderer, volcanoMesh;
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
let isInitialized = false;
let animationFrameId;

window.initVolcano = function() {
  if (isInitialized) return;
  isInitialized = true;

  const container = document.getElementById('canvas-container');

  // Scene setup
  scene = new THREE.Scene();
  // Match the dark background of the app
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.08);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 5);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Volcano Geometry (Cone/Sphere hybrid)
  // Using an Icosahedron as it deforms nicely into organic shapes with noise
  const geometry = new THREE.IcosahedronGeometry(2, 64);
  
  // Custom Shader Material
  const material = new THREE.ShaderMaterial({
    vertexShader: volcanoVertexShader,
    fragmentShader: volcanoFragmentShader,
    uniforms: {
      uTime: { value: 0.0 }
    },
    wireframe: false
  });

  volcanoMesh = new THREE.Mesh(geometry, material);
  
  // Flatten the bottom of the geometry manually just in case
  const posAttribute = geometry.attributes.position;
  for(let i=0; i<posAttribute.count; i++) {
    let y = posAttribute.getY(i);
    if(y < -1.0) {
      posAttribute.setY(i, -1.0);
    }
  }
  geometry.computeVertexNormals();

  volcanoMesh.position.y = -0.5;
  scene.add(volcanoMesh);

  // Particles / Sparks (Ash floating around)
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 500;
  const posArray = new Float32Array(particlesCount * 3);
  
  for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xff4400,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Event Listeners
  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  animate();
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) * 0.001;
  mouseY = (event.clientY - windowHalfY) * 0.001;
}

function onWindowResize() {
  if(!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const elapsedTime = performance.now() * 0.001;

  // Update Shader Uniforms
  if(volcanoMesh) {
    volcanoMesh.material.uniforms.uTime.value = elapsedTime;
    
    // Parallax based on scroll
    // The more we scroll down, the more the camera tilts up to look at the volcano
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = scrollY / maxScroll; // 0 to 1
    
    // Base rotation plus slow continuous spin
    volcanoMesh.rotation.y = elapsedTime * 0.1;
    
    // Camera Parallax Movement
    targetX = mouseX * 2;
    targetY = mouseY * 2 - (scrollPercent * 3); // Move camera down as we scroll (so volcano goes up)
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y + 1.0) * 0.05; // +1.0 is base height
    camera.lookAt(scene.position);
  }

  renderer.render(scene, camera);
}

// Cleanup if page is unloaded or navigated via SPA router (if applicable)
window.addEventListener('beforeunload', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
