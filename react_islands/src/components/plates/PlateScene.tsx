import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PlateModel, type BoundaryKey } from "./PlateModel";

export type ViewKey = "orbit" | "top" | "side";

const VIEWS: Record<ViewKey, { pos: [number, number, number]; target: [number, number, number] }> = {
  orbit: { pos: [19, 13, 23], target: [0, 0.5, 0] },
  top: { pos: [0, 34, 0.6], target: [0, 0, 0] },
  side: { pos: [0, 4.5, 32], target: [0, -0.5, 0] },
};

function Rig({ view }: { view: ViewKey }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);
  const last = useRef<ViewKey | null>(null);
  const moving = useRef(0);

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
      minDistance={6}
      maxDistance={70}
      maxPolarAngle={Math.PI / 2 + 0.12}
      target={[0, 0.5, 0]}
    />
  );
}

export function PlateScene({ view, mode }: { view: ViewKey; mode: BoundaryKey }) {
  const [ready, setReady] = useState(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: VIEWS.orbit.pos, fov: 55, near: 0.1, far: 300 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        setReady(true);
      }}
    >
      <color attach="background" args={["#0e0a09"]} />
      <fog attach="fog" args={["#161010", 55, 140]} />

      <ambientLight intensity={0.4} color="#a8bcd6" />
      <hemisphereLight args={["#8ea6c6", "#3a2418", 0.9]} />
      <directionalLight
        position={[18, 24, 12]}
        intensity={2.6}
        color="#ffe0bd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Environment>
        <Lightformer intensity={1.4} position={[0, 14, 0]} scale={[30, 30, 1]} color="#9fb6d2" />
        <Lightformer intensity={0.7} color="#ff8a4a" position={[0, 3, 0]} scale={[8, 8, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <PlateModel mode={mode} />
      </Suspense>

      {/* Dark volcanic plain */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -6.4, 0]} receiveShadow>
        <circleGeometry args={[120, 64]} />
        <meshStandardMaterial color="#211a16" roughness={1} />
      </mesh>

      {ready && <Rig view={view} />}
    </Canvas>
  );
}