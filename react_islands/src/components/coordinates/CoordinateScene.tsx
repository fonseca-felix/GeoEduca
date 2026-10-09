import { Suspense, useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import globeMap from "@/assets/globe-map.png";

export type Coordinate = { lat: number; lon: number };

function point(lat: number, lon: number, r = 2.52): [number, number, number] {
  const a = lat * Math.PI / 180;
  const b = lon * Math.PI / 180;
  return [-r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b)];
}

function curve(points: [number, number, number][], color: string, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  return <lineSegments geometry={geometry}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineSegments>;
}

function Graticule() {
  const { fine, equator, meridian, grid, frame } = useMemo(() => {
    const fine: [number, number, number][] = [], equator: [number, number, number][] = [], meridian: [number, number, number][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 3) {
        (lat === 0 ? equator : fine).push(point(lat, lon, 2.527), point(lat, lon + 3, 2.527));
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -90; lat < 90; lat += 3) {
        (lon === 0 ? meridian : fine).push(point(lat, lon, 2.53), point(lat + 3, lon, 2.53));
      }
    }
    const grid: [number, number, number][] = [], frame: [number, number, number][] = [];
    for (let n = -5; n <= 5; n++) {
      grid.push([-5,-3.05,n],[5,-3.05,n],[n,-3.05,-5],[n,-3.05,5]);
    }
    for (const y of [-3.05,3.6]) {
      frame.push([-5,y,-5],[5,y,-5],[5,y,-5],[5,y,5],[5,y,5],[-5,y,5],[-5,y,5],[-5,y,-5]);
    }
    for (const x of [-5,5]) for (const z of [-5,5]) frame.push([x,-3.05,z],[x,3.6,z]);
    return { fine, equator, meridian, grid, frame };
  }, []);
  return <>
    {curve(grid, "#42646a", .42)}
    {curve(frame, "#6c8f90", .27)}
    {curve(fine, "#bdc7ac", .48)}
    {curve(equator, "#f3aa5a", .95)}
    {curve(meridian, "#e5d5a5", .95)}
  </>;
}

function Globe({ value, onChange }: { value: Coordinate; onChange: (c: Coordinate) => void }) {
  const texture = useTexture(globeMap);
  texture.colorSpace = THREE.SRGBColorSpace;
  const p = point(value.lat, value.lon, 2.55);
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const uv = e.uv;
    if (!uv) return;
    onChange({ lat: Math.max(-90, Math.min(90, Math.round((uv.y - .5) * 180))), lon: Math.max(-180, Math.min(180, Math.round(uv.x * 360 - 180))) });
  };
  return <>
    <mesh rotation-y={-Math.PI / 2} onClick={handleClick}>
      <sphereGeometry args={[2.5, 96, 64]} />
      <meshStandardMaterial map={texture} roughness={.92} metalness={.02} />
    </mesh>
    <mesh position={p}>
      <sphereGeometry args={[.095, 20, 16]} />
      <meshBasicMaterial color="#ffad56" />
    </mesh>
    <mesh position={p}>
      <sphereGeometry args={[.17, 24, 16]} />
      <meshBasicMaterial color="#ffad56" transparent opacity={.22} depthWrite={false} />
    </mesh>
    <mesh position={[p[0], -3.02, p[2]]} rotation-x={-Math.PI/2}>
      <ringGeometry args={[.11,.16,32]} />
      <meshBasicMaterial color="#ffad56" side={THREE.DoubleSide} />
    </mesh>
    {curve([p, [p[0],-3.01,p[2]]], "#ffad56", .8)}
  </>;
}

export function CoordinateScene({ value, onChange }: { value: Coordinate; onChange: (c: Coordinate) => void }) {
  return <Canvas dpr={[1,1.5]} camera={{ position: [0,3.4,9.8], fov: 48, near: .1, far: 100 }} gl={{ antialias: true }}>
    <color attach="background" args={["#131c1c"]} />
    <ambientLight intensity={1.3} color="#d6e1d4" />
    <directionalLight position={[4,6,8]} intensity={2.2} color="#fff3d8" />
    <Environment><Lightformer intensity={2} position={[-5,6,6]} scale={[12,12,1]} color="#c4ded3" /></Environment>
    <Suspense fallback={null}><Globe value={value} onChange={onChange} /></Suspense>
    <Graticule />
    <OrbitControls enableDamping dampingFactor={.08} minDistance={5.2} maxDistance={16} target={[0,0,0]} minPolarAngle={.12} maxPolarAngle={Math.PI-.12} />
  </Canvas>;
}
