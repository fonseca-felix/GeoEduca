import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CoordinateScene, type Coordinate } from "@/components/coordinates/CoordinateScene";
import "./styles.css";

const START = { lat: -23, lon: -46 };
const places = [
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Greenwich", lat: 51.48, lon: 0 },
  { name: "Equador", lat: 0, lon: 0 },
  { name: "Tóquio", lat: 35.68, lon: 139.69 },
];

function format(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}° ${value >= 0 ? positive : negative}`;
}
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function CoordinatesPage() {
  const [mounted, setMounted] = useState(false);
  const [coordinate, setCoordinate] = useState<Coordinate>(START);
  useEffect(() => setMounted(true), []);

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
      
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary" style={{ color: '#cca43b' }}>Cartografia — Módulo 06</p>
          <h1 className="font-display text-5xl uppercase leading-none sm:text-7xl">Latitude <span style={{ color: '#cca43b' }}>&amp;</span> longitude</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Encontre qualquer ponto da Terra. Clique no globo para descobrir suas coordenadas.</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><i className="fa-solid fa-crosshairs" style={{ color: '#cca43b' }}></i> Arraste para girar — role para aproximar</span>
      </div>

      <div className="grid gap-0 border border-border lg:grid-cols-[minmax(0,1fr)_280px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="relative h-[440px] overflow-hidden bg-card sm:h-[590px] lg:h-[650px]" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px 0 0 8px' }}>
          {mounted ? <CoordinateScene value={coordinate} onChange={setCoordinate} /> : <div className="grid h-full place-items-center text-muted-foreground">Carregando globo...</div>}
          <div className="pointer-events-none absolute left-4 top-4 border-l-2 pl-3 text-xs uppercase text-muted-foreground sm:left-6 sm:top-6" style={{ borderColor: '#cca43b' }}>01 / Globo terrestre<br/><span className="text-foreground">Projeção espacial</span></div>
          <div className="pointer-events-none absolute bottom-4 left-4 text-xs text-muted-foreground sm:bottom-6 sm:left-6">N <span style={{ color: '#cca43b' }}>—</span> 360°</div>
        </div>

        <aside className="flex flex-col border-t border-border bg-card lg:border-l lg:border-t-0" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0 8px 8px 0' }}>
          <div className="border-b border-border p-5 sm:p-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold uppercase" style={{ color: '#cca43b' }}>Ponto selecionado</p>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div><span className="text-xs uppercase text-muted-foreground">Latitude</span><p className="font-display text-4xl text-foreground" style={{ fontSize: '2.5rem' }}>{format(coordinate.lat,"N","S")}</p></div>
              <div><span className="text-xs uppercase text-muted-foreground">Longitude</span><p className="font-display text-4xl" style={{ fontSize: '2.5rem', color: '#cca43b' }}>{format(coordinate.lon,"L","O")}</p></div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{coordinate.lat >= 0 ? "Hemisfério Norte" : "Hemisfério Sul"} — {coordinate.lon >= 0 ? "Hemisfério Oriental" : "Hemisfério Ocidental"}</p>
          </div>
          
          <div className="border-b border-border p-5 sm:p-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">Ajustar coordenadas</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground">Latitude (-90 a 90)
                <input aria-label="Latitude" type="number" min={-90} max={90} step={1} value={coordinate.lat} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) setCoordinate(c => ({...c, lat: clamp(n,-90,90)})); }} className="mt-2 h-10 w-full border border-input bg-background px-3 text-base text-foreground outline-none focus:border-primary" style={{ background: '#000', borderColor: '#333' }} />
              </label>
              <label className="text-xs text-muted-foreground">Longitude (-180 a 180)
                <input aria-label="Longitude" type="number" min={-180} max={180} step={1} value={coordinate.lon} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) setCoordinate(c => ({...c, lon: clamp(n,-180,180)})); }} className="mt-2 h-10 w-full border border-input bg-background px-3 text-base text-foreground outline-none focus:border-primary" style={{ background: '#000', borderColor: '#333' }} />
              </label>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Pontos de referência</p>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {places.map(place => <button key={place.name} className="flex justify-start items-center rounded text-xs px-3 py-2 border border-border hover:bg-gray-800 transition" style={{ borderColor: '#333' }} onClick={() => setCoordinate({lat:place.lat,lon:place.lon})}>{place.name}</button>)}
            </div>
          </div>
          
          <div className="mt-auto border-t border-border p-5 sm:p-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
             <button className="flex justify-start items-center gap-2 w-full text-xs text-muted-foreground hover:text-white transition" onClick={() => setCoordinate(START)}>
               <i className="fa-solid fa-rotate-left"></i> Reiniciar coordenadas
             </button>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 border-b border-border py-9 sm:grid-cols-3 sm:gap-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div><span className="font-display text-2xl" style={{ color: '#cca43b' }}>01 /</span><h2 className="mt-2 font-display text-2xl uppercase">Latitude</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Distância ao norte ou ao sul da linha do Equador. Vai de 0° a 90°.</p></div>
        <div><span className="font-display text-2xl" style={{ color: '#cca43b' }}>02 /</span><h2 className="mt-2 font-display text-2xl uppercase">Longitude</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Distância a leste ou a oeste do meridiano de Greenwich. Vai de 0° a 180°.</p></div>
        <div><span className="font-display text-2xl" style={{ color: '#cca43b' }}>03 /</span><h2 className="mt-2 font-display text-2xl uppercase">Interseção</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">O cruzamento de um paralelo com um meridiano identifica um lugar na Terra.</p></div>
      </div>
    </div>
  </main>;
}

const rootElement = document.getElementById("react-latitude-root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<CoordinatesPage />);
}
