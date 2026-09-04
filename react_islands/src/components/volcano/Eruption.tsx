import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CRATER_FLOOR } from "./VolcanoModel";

type Bit = { vx: number; vy: number; vz: number; life: number; max: number; scale: number };

/** Glowing ejecta arcs + rising ash column, anchored on the crater. */
export function Eruption({ active }: { active: boolean }) {
  const COUNT = 90;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bits = useMemo<Bit[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        vx: 0,
        vy: 0,
        vz: 0,
        life: Math.random() * 2,
        max: 1.4 + Math.random() * 1.6,
        scale: 0.06 + Math.random() * 0.16,
      })),
    [],
  );
  const pos = useMemo(() => Array.from({ length: COUNT }, () => new THREE.Vector3()), []);

  const respawn = (b: Bit, p: THREE.Vector3) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.7;
    p.set(Math.cos(a) * r, CRATER_FLOOR + 0.2, Math.sin(a) * r);
    const spread = 1.4 + Math.random() * 2.6;
    b.vx = Math.cos(a) * spread * Math.random();
    b.vz = Math.sin(a) * spread * Math.random();
    b.vy = 6 + Math.random() * 7;
    b.life = 0;
  };

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const mesh = meshRef.current;
    if (mesh) {
      for (let i = 0; i < COUNT; i++) {
        const b = bits[i]!;
        const p = pos[i]!;
        if (!active) {
          dummy.position.set(0, -999, 0);
          dummy.scale.setScalar(0.001);
        } else {
          b.life += dt;
          if (b.life <= 0 || b.life > b.max) respawn(b, p);
          b.vy -= 11 * dt;
          p.x += b.vx * dt;
          p.y += b.vy * dt;
          p.z += b.vz * dt;
          dummy.position.copy(p);
          dummy.scale.setScalar(b.scale * (1 - b.life / b.max / 2));
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    const smoke = smokeRef.current;
    if (smoke) {
      const t = state.clock.elapsedTime;
      for (let i = 0; i < 22; i++) {
        const f = ((t * 0.22 + i / 22) % 1);
        const h = f * 16;
        const s = active ? 0.9 + f * 4.2 : 0.5 + f * 2.2;
        dummy.position.set(
          Math.sin(i * 2.3 + t * 0.4) * f * 2.6,
          CRATER_FLOOR + 0.4 + h,
          Math.cos(i * 1.7 + t * 0.35) * f * 2.6,
        );
        dummy.rotation.set(0, t * 0.2 + i, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        smoke.setMatrixAt(i, dummy.matrix);
      }
      smoke.instanceMatrix.needsUpdate = true;
      (smoke.material as THREE.MeshStandardMaterial).opacity = active ? 0.3 : 0.13;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#ff8a2a"
          emissive="#ff6a10"
          emissiveIntensity={2.6}
          toneMapped={false}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={smokeRef} args={[undefined, undefined, 22]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#6d6560" transparent opacity={0.18} depthWrite={false} roughness={1} />
      </instancedMesh>
    </group>
  );
}
