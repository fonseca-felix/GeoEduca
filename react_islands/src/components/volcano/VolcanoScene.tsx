import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VolcanoModel, CRATER_FLOOR } from "./VolcanoModel";
import { Eruption } from "./Eruption";

export type ViewKey = "orbit" | "top" | "inside" | "cut";

const VIEWS: Record<ViewKey, { pos: [number, number, number]; target: [number, number, number] }> = {
  orbit: { pos: [17, 10, 19], target: [0, 3.6, 0] },
  top: { pos: [0, 32, 0.8], target: [0, 3, 0] },
  inside: { pos: [0, 5.1, 1.35], target: [0, CRATER_FLOOR - 0.1, 0] },
  cut: { pos: [0, 4, 26], target: [0, 1, 0] },
};

function Rig({ view }: { view: ViewKey }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);
  const last = useRef<ViewKey | null>(null);
  const moving = useRef(0);

  // Responsividade do enquadramento
  const { size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    // Se a tela for estreita (celular/tablet), aumenta o FOV para afastar o vulcão e caber na tela
    camera.fov = aspect < 1 ? 80 : aspect < 1.3 ? 65 : 55;
    camera.updateProjectionMatrix();
  }, [size, camera]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (last.current !== view) {
      last.current = view;
      moving.current = 1.6;
    }
    if (moving.current > 0 && controls.current) {
      moving.current -= dt;
      const v = VIEWS[view];
      goal.set(...v.pos);
      goalTarget.set(...v.target);
      const k = 1 - Math.exp(-4 * dt);
      camera.position.lerp(goal, k);
      controls.current.target.lerp(goalTarget, k);
      controls.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.1}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2 + 0.25}
      target={[0, 3, 0]}
    />
  );
}

export function VolcanoScene({
  view,
  erupting,
  cut,
}: {
  view: ViewKey;
  erupting: boolean;
  cut: boolean;
}) {
  const [ready, setReady] = useState(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: VIEWS.orbit.pos, fov: 55, near: 0.05, far: 300 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        setReady(true);
      }}
    >
      <color attach="background" args={["#0d0a0b"]} />
      <fog attach="fog" args={["#15100f", 45, 130]} />

      <ambientLight intensity={0.35} color="#a8bcd6" />
      <hemisphereLight args={["#8ea6c6", "#3a2418", 0.85]} />
      <directionalLight
        position={[18, 22, 12]}
        intensity={2.8}
        color="#ffe0bd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Environment>
        <Lightformer intensity={1.4} position={[0, 12, 0]} scale={[30, 30, 1]} color="#9fb6d2" />
        <Lightformer intensity={0.6} color="#ff8a4a" position={[0, 4, 0]} scale={[6, 6, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <VolcanoModel cut={cut} erupting={erupting} />
        <Eruption active={erupting} />
      </Suspense>

      {/* Volcanic plain */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial color="#241d1a" roughness={1} />
      </mesh>

      {ready && <Rig view={view} />}
    </Canvas>
  );
}
