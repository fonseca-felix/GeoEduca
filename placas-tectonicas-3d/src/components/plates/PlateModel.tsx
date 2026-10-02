import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type BoundaryKey = "convergente" | "divergente" | "transformante";

type PlateTarget = { x: number; y: number; z: number; rz: number };
type ModeTarget = {
  left: PlateTarget;
  right: PlateTarget;
  mountain: number; // 0..1 cordilheira no limite convergente
  magma: number; // 0..1 coluna de magma no limite divergente
  fault: number; // 0..1 brilho da falha no limite transformante
};

/** Resting pose: two plates side by side, edges meeting at x = 0. */
const REST_LEFT: PlateTarget = { x: -5.5, y: 0, z: 0, rz: 0 };
const REST_RIGHT: PlateTarget = { x: 5.5, y: 0, z: 0, rz: 0 };

const TARGETS: Record<BoundaryKey, ModeTarget> = {
  convergente: {
    left: { x: -4.7, y: 0.25, z: 0, rz: 0.05 },
    right: { x: 4.4, y: -1.15, z: 0, rz: 0.32 },
    mountain: 1,
    magma: 0.12,
    fault: 0,
  },
  divergente: {
    left: { x: -7.6, y: 0, z: 0, rz: -0.02 },
    right: { x: 7.6, y: 0, z: 0, rz: 0.02 },
    mountain: 0.22,
    magma: 1,
    fault: 0,
  },
  transformante: {
    left: { x: -5.5, y: 0, z: 2.9, rz: 0 },
    right: { x: 5.5, y: 0, z: -2.9, rz: 0 },
    mountain: 0,
    magma: 0,
    fault: 1,
  },
};

/** Crust block with a craggy top surface. */
function craggyBlock(color: string) {
  const geo = new THREE.BoxGeometry(11, 2.4, 13, 26, 3, 24);
  const pos = geo.attributes["position"] as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y > 1.1) {
      v.y +=
        Math.sin(v.x * 1.3) * Math.sin(v.z * 1.1) * 0.16 +
        Math.sin(v.x * 3.1 + v.z * 2.3) * 0.09 +
        Math.sin(v.z * 4.7 + v.x) * 0.05;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

function Arrow({
  from,
  dir,
  color = "#ffb347",
}: {
  from: [number, number, number];
  dir: [number, number, number];
  color?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const d = useMemo(() => new THREE.Vector3(...dir).normalize(), [dir]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d),
    [d],
  );
  const origin = useMemo(() => new THREE.Vector3(...from), [from]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const k = 0.18 * Math.sin(t * 2.2);
    group.current.position.copy(origin).addScaledVector(d, k);
  });

  return (
    <group ref={group} position={from} quaternion={quat}>
      <mesh position-x={0.7} rotation-z={-Math.PI / 2}>
        <cylinderGeometry args={[0.09, 0.09, 1.5, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh position-x={1.7} rotation-z={-Math.PI / 2}>
        <coneGeometry args={[0.28, 0.7, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

const ARROWS: Record<BoundaryKey, { from: [number, number, number]; dir: [number, number, number] }[]> = {
  convergente: [
    { from: [-4.6, 4.2, 0], dir: [1, 0, 0] },
    { from: [4.6, 4.2, 0], dir: [-1, 0, 0] },
  ],
  divergente: [
    { from: [-4.2, 4.2, 0], dir: [-1, 0, 0] },
    { from: [4.2, 4.2, 0], dir: [1, 0, 0] },
  ],
  transformante: [
    { from: [-4.6, 4.2, 0], dir: [0, 0, 1] },
    { from: [4.6, 4.2, 0], dir: [0, 0, -1] },
  ],
};

export function PlateModel({ mode }: { mode: BoundaryKey }) {
  const left = useMemo(() => craggyBlock("#5d5044"), []);
  const right = useMemo(() => craggyBlock("#4a423b"), []);

  const leftG = useRef<THREE.Group>(null);
  const rightG = useRef<THREE.Group>(null);
  const mountainG = useRef<THREE.Group>(null);
  const magmaM = useRef<THREE.MeshStandardMaterial>(null);
  const magmaMesh = useRef<THREE.Mesh>(null);
  const magmaLight = useRef<THREE.PointLight>(null);
  const faultM = useRef<THREE.MeshStandardMaterial>(null);
  const mantleM = useRef<THREE.MeshStandardMaterial>(null);

  // Current animated values (lerped toward the mode targets)
  const cur = useRef({
    left: { ...REST_LEFT },
    right: { ...REST_RIGHT },
    mountain: 0.001,
    magma: 0.001,
    fault: 0.001,
  });

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const k = 1 - Math.exp(-3.2 * dt);
    const tgt = TARGETS[mode];
    const c = cur.current;

    for (const key of ["left", "right"] as const) {
      const a = c[key];
      const b = tgt[key];
      a.x += (b.x - a.x) * k;
      a.y += (b.y - a.y) * k;
      a.z += (b.z - a.z) * k;
      a.rz += (b.rz - a.rz) * k;
    }
    c.mountain += (Math.max(tgt.mountain, 0.001) - c.mountain) * k;
    c.magma += (Math.max(tgt.magma, 0.001) - c.magma) * k;
    c.fault += (Math.max(tgt.fault, 0.001) - c.fault) * k;

    if (leftG.current) {
      leftG.current.position.set(c.left.x, c.left.y, c.left.z);
      leftG.current.rotation.z = c.left.rz;
    }
    if (rightG.current) {
      rightG.current.position.set(c.right.x, c.right.y, c.right.z);
      rightG.current.rotation.z = c.right.rz;
    }
    if (mountainG.current) mountainG.current.scale.setScalar(c.mountain);

    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2.1) * 0.15 + Math.sin(t * 5.3) * 0.05;
    if (magmaMesh.current) magmaMesh.current.scale.set(c.magma, Math.max(c.magma, 0.02), c.magma);
    if (magmaM.current) magmaM.current.emissiveIntensity = 2.4 * pulse;
    if (magmaLight.current) magmaLight.current.intensity = 26 * c.magma * pulse;
    if (faultM.current) faultM.current.emissiveIntensity = 2.6 * c.fault * pulse;
    if (mantleM.current) mantleM.current.emissiveIntensity = (0.9 + c.magma * 0.8) * pulse;
  });

  return (
    <group>
      {/* Asthenosphere: the soft, glowing mantle the plates float on */}
      <mesh position={[0, -3.35, 0]} receiveShadow>
        <boxGeometry args={[30, 6, 16]} />
        <meshStandardMaterial color="#3a2318" roughness={1} />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[30, 0.3, 16]} />
        <meshStandardMaterial
          ref={mantleM}
          color="#c33d08"
          emissive="#ff5a10"
          emissiveIntensity={1}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* The two lithospheric plates */}
      <group ref={leftG} position={[REST_LEFT.x, 0, 0]}>
        <primitive object={left} />
        {/* Mountain range folded up at a convergent boundary */}
        <group ref={mountainG} position={[3.6, 1.1, 0]} scale={0.001}>
          {[-5, -3.4, -1.7, 0, 1.7, 3.4, 5].map((z, i) => (
            <mesh key={i} position={[Math.sin(z * 1.7) * 0.5, 0.9, z]} castShadow>
              <coneGeometry args={[0.85 + (i % 3) * 0.25, 2 + (i % 2) * 0.9, 6]} />
              <meshStandardMaterial color="#6b5b4a" roughness={0.95} flatShading />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={rightG} position={[REST_RIGHT.x, 0, 0]}>
        <primitive object={right} />
      </group>

      {/* Magma rising into the rift at a divergent boundary */}
      <mesh ref={magmaMesh} position={[0, 0.4, 0]} scale={0.001}>
        <cylinderGeometry args={[1.7, 2.3, 3.4, 20]} />
        <meshStandardMaterial
          ref={magmaM}
          color="#ff4a08"
          emissive="#ff7a1a"
          emissiveIntensity={2.4}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={magmaLight} position={[0, 1.6, 0]} color="#ff7a2a" distance={22} decay={2} intensity={0} />

      {/* Glowing fault line at a transform boundary */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.22, 2.6, 15.5]} />
        <meshStandardMaterial
          ref={faultM}
          color="#ff5a10"
          emissive="#ff8a2a"
          emissiveIntensity={0.001}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>

      {/* Motion arrows above each plate */}
      {ARROWS[mode].map((a, i) => (
        <Arrow key={`${mode}-${i}`} from={a.from} dir={a.dir} />
      ))}
    </group>
  );
}