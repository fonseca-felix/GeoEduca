import { useEffect, useRef } from "react";

// Fixed 3D globe; reads global loop progress (0..1) from progressRef.
export function Globe({ progressRef }: { progressRef: { current: number } }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.z = 6;

      // Procedural relief texture
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const g = c.getContext("2d")!;
      g.fillStyle = "#0B0A32"; g.fillRect(0, 0, 1024, 512);
      const blobs: [number, number, number][] = [
        [330, 300, 70], [360, 240, 50], [300, 200, 40], [250, 140, 60], [200, 120, 45], // Americas
        [530, 150, 50], [560, 250, 60], [580, 330, 50], // Europe/Africa
        [700, 150, 90], [760, 200, 70], [800, 260, 40], // Asia
        [860, 360, 45], // Australia
      ];
      for (const [x, y, r] of blobs) {
        for (let i = 0; i < 260; i++) {
          const a = Math.random() * Math.PI * 2, d = Math.random() * r;
          const gr = g.createRadialGradient(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 0, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 14);
          gr.addColorStop(0, "rgba(60,90,25,0.5)"); gr.addColorStop(1, "rgba(35,59,11,0)");
          g.fillStyle = gr; g.fillRect(x + Math.cos(a) * d - 14, y + Math.sin(a) * d * 0.8 - 14, 28, 28);
        }
      }
      g.strokeStyle = "rgba(204,164,59,0.25)"; g.lineWidth = 1;
      for (let i = 0; i <= 1024; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); }
      for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;

      const globe = new THREE.Group();
      scene.add(globe);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 96, 96),
        new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.04, roughness: 0.8, metalness: 0.1 }),
      );
      globe.add(sphere);

      // Gold dots shell
      const pts: number[] = [];
      for (let i = 0; i < 1800; i++) {
        const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        pts.push(1.53 * s * Math.cos(t), 1.53 * u, 1.53 * s * Math.sin(t));
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      globe.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xcca43b, size: 0.012, transparent: true, opacity: 0.7 })));

      // Orbiting pins
      const pins = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const pin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xcca43b, emissive: 0x6a5010 }));
        const a = (i / 6) * Math.PI * 2;
        pin.position.set(Math.cos(a) * 2.1, Math.sin(a * 2) * 0.4, Math.sin(a) * 2.1);
        pin.rotation.x = Math.PI;
        pins.add(pin);
      }
      scene.add(pins);

      // Atmosphere (fresnel)
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.75, 64, 64),
        new THREE.ShaderMaterial({
          transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
          vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
          fragmentShader: `varying vec3 vN; void main(){ float i = pow(max(0.62 - dot(vN, vec3(0,0,1.0)), 0.0), 4.0); gl_FragColor = vec4(0.8,0.64,0.23,1.0)*i*0.7; }`,
        }),
      );
      scene.add(atmo);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const sun = new THREE.DirectionalLight(0xfff1d0, 2.2);
      sun.position.set(-4, 2, 5);
      scene.add(sun);

      // Keyframes per slide: [x, y, z(cam), tiltX, rotY offset]
      const keys: [number, number, number, number, number][] = [
        [0, 0, 6, 0.2, 0], [2.2, 0.2, 5, 0.3, 1.8], [-2.4, 0, 7.5, 0.1, 3],
        [2.3, -0.3, 4.6, 0.45, 2.2], [-2.2, 0.3, 6.5, 0.2, 4], [0, -2.2, 5, 0.6, 5], [0, 0, 9, 0.1, 6.28], [0, 0, 6, 0.2, 6.28],
      ];
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      let raf = 0, spin = 0;
      const tick = () => {
        const p = progressRef.current * 7;
        const i = Math.min(6, Math.floor(p)), t = p - i;
        const e = t * t * (3 - 2 * t);
        const a = keys[i]!, b = keys[i + 1]!;
        spin += 0.006;
        globe.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e), 0);
        atmo.position.copy(globe.position);
        pins.position.copy(globe.position);
        camera.position.z = lerp(a[2], b[2], e);
        globe.rotation.x = lerp(a[3], b[3], e);
        globe.rotation.y = spin + lerp(a[4], b[4], e);
        pins.rotation.y -= 0.004;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();
      const onResize = () => {
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      };
      window.addEventListener("resize", onResize);
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        el.removeChild(renderer.domElement);
      };
    });
    return () => { disposed = true; cleanup(); };
  }, [progressRef]);

  return <div ref={host} className="pointer-events-none fixed inset-0 z-[1]" aria-hidden />;
}
