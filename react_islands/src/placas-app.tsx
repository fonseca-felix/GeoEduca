import { useEffect, useState } from "react";
import { PlateScene, type ViewKey } from "./components/plates/PlateScene";
import type { BoundaryKey } from "./components/plates/PlateModel";

const VIEW_BUTTONS: { key: ViewKey; label: string; hint: string }[] = [
  { key: "orbit", label: "Órbita", hint: "Vista geral do bloco de crosta" },
  { key: "top", label: "Por cima", hint: "As placas vistas de cima" },
  { key: "side", label: "De perfil", hint: "O corte: placas sobre o manto derretido" },
];

const MODES: {
  key: BoundaryKey;
  label: string;
  hint: string;
  motion: string;
  feature: string;
  text: string;
}[] = [
  {
    key: "convergente",
    label: "Convergente",
    hint: "As placas se aproximam e colidem",
    motion: "Aproximação · ~2 a 8 cm/ano",
    feature: "Subducção + cordilheiras",
    text: "As placas se movem uma contra a outra. A mais densa mergulha sob a outra (subducção) em direção ao manto, enquanto a borda da placa que fica por cima se enruga e sobe, formando montanhas e vulcões — como os Andes.",
  },
  {
    key: "divergente",
    label: "Divergente",
    hint: "As placas se afastam e o magma sobe",
    motion: "Afastamento · ~2 a 5 cm/ano",
    feature: "Dorsal meso-oceânica",
    text: "As placas se afastam e o magma do manto derretido sobe para preencher a fenda, criando crosta nova. É assim que nascem as dorsais meso-oceânicas, como a que parte o Oceano Atlântico ao meio.",
  },
  {
    key: "transformante",
    label: "Transformante",
    hint: "As placas deslizam uma ao lado da outra",
    motion: "Deslize lateral · ~5 cm/ano",
    feature: "Falha + terremotos",
    text: "As placas deslizam horizontalmente uma ao lado da outra, sem criar nem destruir crosta. O atrito acumula tensão até liberar energia de repente: são os terremotos, como na Falha de San Andreas.",
  },
];

const ANATOMY = [
  { n: "01", t: "Litosfera", d: "A camada rígida e externa da Terra — crosta + parte superior do manto — quebrada em cerca de 15 grandes placas." },
  { n: "02", t: "Astenosfera", d: "Camada quente e pastosa do manto, sobre a qual as placas litosféricas flutuam e deslizam lentamente." },
  { n: "03", t: "Subducção", d: "Quando uma placa oceânica, mais densa, mergulha sob outra placa e volta a derreter no manto." },
  { n: "04", t: "Dorsal meso-oceânica", d: "Cordilheira submarina formada onde as placas se separam e o magma sobe, criando assoalho oceânico novo." },
  { n: "05", t: "Falha transformante", d: "Limite em que as placas deslizam lado a lado, acumulando tensão que se libera em terremotos." },
  { n: "06", t: "Anel de Fogo", d: "Faixa que contorna o Oceano Pacífico, com 75% dos vulcões ativos e 90% dos terremotos do planeta." },
];

export default function Index() {
  const [view, setView] = useState<ViewKey>("orbit");
  const [mode, setMode] = useState<BoundaryKey>("convergente");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = MODES.find((m) => m.key === mode)!;

  return (
    <main className="min-h-screen bg-background text-foreground" style={{ backgroundColor: '#0d0a0b', color: '#f4efe9' }}>
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <p className="text-xs uppercase tracking-[0.28em] text-primary" style={{ color: '#ff6b2c' }}>
          Laboratório de Geologia · Módulo 05
        </p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-7xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Placas <span className="text-primary" style={{ color: '#ff6b2c' }}>tectônicas</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground" style={{ color: '#a89f94' }}>
          Modelo 3D de verdade: arraste para girar em 360°, use a roda do mouse para o zoom e
          alterne entre os três tipos de limite para ver as placas colidirem, se afastarem ou
          deslizarem lado a lado sobre o manto derretido.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-6">
        <div className="relative h-[70vh] min-h-[520px] overflow-hidden rounded-3xl border border-border bg-card" style={{ borderColor: '#2f2722', backgroundColor: '#141011' }}>
          {mounted ? (
            <PlateScene view={view} mode={mode} />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground" style={{ color: '#a89f94' }}>
              Carregando as placas…
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
            <div className="pointer-events-auto flex flex-wrap gap-2 rounded-full border border-border bg-card/80 p-1.5 backdrop-blur" style={{ borderColor: '#2f2722', backgroundColor: 'rgba(20, 16, 17, 0.8)' }}>
              {MODES.map((m) => (
                <button
                  key={m.key}
                  title={m.hint}
                  onClick={() => setMode(m.key)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
                    mode === m.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={mode === m.key ? { backgroundColor: '#ff6b2c', color: '#0d0a0b' } : { color: '#a89f94' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto flex flex-wrap gap-2 rounded-full border border-border bg-card/80 p-1.5 backdrop-blur" style={{ borderColor: '#2f2722', backgroundColor: 'rgba(20, 16, 17, 0.8)' }}>
              {VIEW_BUTTONS.map((b) => (
                <button
                  key={b.key}
                  title={b.hint}
                  onClick={() => setView(b.key)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
                    view === b.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={view === b.key ? { backgroundColor: '#2f2722', color: '#f4efe9' } : { color: '#a89f94' }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <p className="pointer-events-none absolute right-5 top-4 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground" style={{ color: '#a89f94' }}>
            arraste para girar · roda do mouse para zoom
          </p>
        </div>

        <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3" style={{ borderColor: '#2f2722', backgroundColor: '#2f2722' }}>
          {[
            { k: "Limite", v: current.label },
            { k: "Movimento", v: current.motion },
            { k: "Resultado", v: current.feature },
          ].map((r) => (
            <div key={r.k} className="bg-card px-5 py-4" style={{ backgroundColor: '#141011' }}>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground" style={{ color: '#a89f94' }}>
                {r.k}
              </span>
              <strong className="mt-1 block font-display text-2xl uppercase" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{r.v}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card px-6 py-5" style={{ borderColor: '#2f2722', backgroundColor: '#141011' }}>
          <p className="text-xs uppercase tracking-[0.24em] text-primary" style={{ color: '#ff6b2c' }}>
            Limite {current.label}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground" style={{ color: '#a89f94' }}>
            {current.text}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.28em] text-primary" style={{ color: '#ff6b2c' }}>Anatomia</p>
        <h2 className="mt-3 font-display text-4xl uppercase sm:text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          A Terra por dentro
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANATOMY.map((c) => (
            <article
              key={c.n}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary"
              style={{ borderColor: '#2f2722', backgroundColor: '#141011' }}
            >
              <span className="font-display text-sm tracking-[0.2em] text-primary" style={{ color: '#ff6b2c', fontFamily: 'Bebas Neue, sans-serif' }}>{c.n}</span>
              <h3 className="mt-2 font-display text-2xl uppercase" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground" style={{ color: '#a89f94' }}>{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground" style={{ borderColor: '#2f2722', color: '#a89f94' }}>
        Laboratório de Geologia Interativa · placas tectônicas em 3D
      </footer>
    </main>
  );
}
