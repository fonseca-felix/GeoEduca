import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Profile of the mountain, revolved around the Y axis.
 * Goes from the outer base up to the rim, then down into the crater funnel. */
const PROFILE: [number, number][] = [
  [8.8, 0],
  [7.3, 0.9],
  [5.9, 2.1],
  [4.7, 3.3],
  [3.7, 4.5],
  [2.9, 5.6],
  [2.4, 6.4],
  [2.2, 6.75], // rim
  [1.95, 6.6],
  [1.7, 6.0],
  [1.5, 5.2],
  [1.35, 4.5],
  [1.25, 4.1],
  [0.0, 3.95], // crater floor
];

const CRATER_FLOOR = 3.95;

function craggyLathe(segments = 128) {
  const pts = PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, segments);
  const pos = geo.attributes["position"] as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 0.05) continue;
    const a = Math.atan2(v.z, v.x);
    const ridges =
      Math.sin(a * 7) * 0.16 +
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

export function VolcanoModel({ cut, erupting }: { cut: boolean; erupting: boolean }) {
  const geometry = useMemo(() => craggyLathe(), []);
  const clip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)], []);

  const lavaRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.6) * 0.18 + Math.sin(t * 4.1) * 0.06;
    if (lavaRef.current) lavaRef.current.emissiveIntensity = (erupting ? 3.4 : 1.9) * pulse;
    if (lightRef.current) lightRef.current.intensity = (erupting ? 14 : 6) * pulse;
  });

  return (
    <group>
      {/* Mountain shell — double sided so the crater walls read from inside */}
      <mesh receiveShadow>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color="#4e453e"
          roughness={0.95}
          metalness={0.05}
          side={THREE.DoubleSide}
          flatShading
          clippingPlanes={cut ? clip : null}
          clipShadows
        />
      </mesh>

      {/* Lava lake at the crater floor */}
      <mesh position={[0, CRATER_FLOOR + 0.04, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.12, 48]} />
        <meshStandardMaterial
          ref={lavaRef}
          color="#ff5a12"
          emissive="#ff7a1a"
          emissiveIntensity={2}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, CRATER_FLOOR + 0.6, 0]} color="#ff7a2a" distance={14} decay={2} />

      {/* Interior: conduit + magma chamber, revealed by the cross-section */}
      {cut && (
        <group>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.42, 0.78, 4.8, 20, 1, true]} />
            <meshStandardMaterial
              color="#ff4a08"
              emissive="#ff6a12"
              emissiveIntensity={2.2}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, -1.6, 0]} scale={[1, 0.62, 1]}>
            <sphereGeometry args={[3.1, 32, 24]} />
            <meshStandardMaterial
              color="#e03a06"
              emissive="#ff5a10"
              emissiveIntensity={1.6}
              roughness={0.5}
              toneMapped={false}
            />
          </mesh>
          {/* Lateral dike */}
          <mesh position={[2.1, 1.2, 0]} rotation-z={-0.5}>
            <cylinderGeometry args={[0.18, 0.3, 4, 12]} />
            <meshStandardMaterial color="#ff6a12" emissive="#ff6a12" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          {/* Crust layers hint */}
          {[0.4, 1.6, 2.9].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.9 + i * 0.4, 8.6 - i * 1.9, 64, 1, 0, Math.PI]} />
              <meshStandardMaterial color={i % 2 ? "#5e514a" : "#3a322e"} side={THREE.DoubleSide} roughness={1} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export { CRATER_FLOOR };
