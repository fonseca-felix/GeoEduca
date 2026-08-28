import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the GSAP script in the head to add Three.js
threejs_scripts = """  <!-- GSAP & Three.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>"""
html = re.sub(r'<!-- GSAP -->.*?</head>', threejs_scripts, html, flags=re.DOTALL)

# Replace the HTML globe container
new_globe = """<!-- The Spinning Globe -->
    <div id="hero-globe">
      <canvas id="globe-3d"></canvas>
    </div>"""
html = re.sub(r'<!-- The Spinning Globe -->.*?</div>\s*</div>\s*</div>', new_globe + '\n  </div>', html, flags=re.DOTALL)

# Add the Three.js script before GSAP animation logic
three_logic = """
<script>
  // Three.js Globe Setup
  const globeCanvas = document.getElementById('globe-3d');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: globeCanvas, alpha: true, antialias: true });
  
  const container = document.getElementById('hero-globe');
  
  function resizeGlobe() {
    if (!container) return;
    const size = container.clientWidth;
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  
  const geometry = new THREE.SphereGeometry(5, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('assets/word-texture.jfif');
  
  const material = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.6,
    metalness: 0.2
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  // Tilt the earth a bit
  sphere.rotation.z = 0.3;
  scene.add(sphere);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffe8b5, 1.2);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);
  
  const backLight = new THREE.DirectionalLight(0x4a4a8a, 0.8);
  backLight.position.set(-5, 3, -5);
  scene.add(backLight);
  
  camera.position.z = 12;
  
  function animateGlobe() {
    requestAnimationFrame(animateGlobe);
    sphere.rotation.y += 0.003; // Spinning map!
    renderer.render(scene, camera);
  }
  
  resizeGlobe();
  animateGlobe();
  window.addEventListener('resize', resizeGlobe);
</script>
<script>
  // Wait for DOM
"""
html = html.replace("<script>\n  // Wait for DOM", three_logic)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html")
