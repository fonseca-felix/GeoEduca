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
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0d0a0b] text-foreground flex flex-col items-center">
      <header className="w-full max-w-4xl px-6 sm:px-8 pt-16 pb-8 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.28em] text-[#cca43b]">
          Laboratório de Geologia · Módulo 05
        </p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl uppercase leading-[0.9] text-white">
          Placas <span className="text-[#cca43b]">tectônicas</span>
        </h1>
        <p className="mt-4 max-w-2xl text-white/60 mx-auto sm:mx-0">
          Modelo 3D interativo: arraste para girar em 360°, use a roda do mouse para zoom e
          alterne entre os três tipos de limite para ver as placas colidirem, se afastarem ou
          deslizarem lado a lado sobre o manto derretido.
        </p>
      </header>

      <section className="w-full max-w-4xl px-6 sm:px-8">
        <div className="relative w-full h-[60vh] sm:h-[65vh] min-h-[450px] overflow-hidden rounded-[2rem] bg-black shadow-2xl">
          {mounted ? (
            <PlateScene view={view} mode={mode} />
          ) : (
            <div className="grid h-full place-items-center text-white/50">
              Carregando as placas…
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 p-6">
            <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  title={m.hint}
                  onClick={() => setMode(m.key)}
                  className={`rounded-full border px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur-md ${
                    mode === m.key
                      ? "border-amber-500 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                      : "border-white/20 bg-black/60 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
              {VIEW_BUTTONS.map((b) => (
                <button
                  key={b.key}
                  title={b.hint}
                  onClick={() => setView(b.key)}
                  className={`rounded-full border px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur-md ${
                    view === b.key
                      ? "border-amber-500 bg-amber-500/20 text-amber-400 hover:bg-amber-500/40"
                      : "border-white/20 bg-black/60 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <p className="pointer-events-none absolute right-6 top-6 text-[0.7rem] uppercase tracking-[0.2em] text-white/50 drop-shadow-md">
            arraste para girar · scrool para zoom
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:gap-10 sm:grid-cols-3">
          {[
            { k: "Limite", v: current.label },
            { k: "Movimento", v: current.motion },
            { k: "Resultado", v: current.feature },
          ].map((r) => (
            <div key={r.k} className="rounded-[1.5rem] bg-[#1a2332]/40 p-8 shadow-lg backdrop-blur-sm transition-all hover:bg-[#1a2332]/60 text-center sm:text-left">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#cca43b]">
                {r.k}
              </span>
              <strong className="mt-3 block font-display text-2xl uppercase text-white">{r.v}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-transparent bg-[#1a2332]/30 p-8 shadow-lg backdrop-blur-sm transition-all text-center sm:text-left">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#cca43b]">
            Limite {current.label}
          </p>
          <p className="mt-3 text-base leading-relaxed text-white/70">
            {current.text}
          </p>
        </div>
      </section>

      <section className="w-full max-w-4xl px-6 sm:px-8 mt-24 mb-32">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#cca43b]">Anatomia</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl uppercase text-white">
            A Terra por dentro
          </h2>
        </div>
        <div className="mt-16 grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {ANATOMY.map((c) => (
            <article
              key={c.n}
              className="rounded-[2rem] border border-transparent bg-[#1a2332]/30 p-10 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#cca43b]/60 hover:-translate-y-1 hover:bg-[#1a2332]/50 text-center sm:text-left"
            >
              <span className="font-display text-sm font-bold tracking-[0.25em] text-[#cca43b]">{c.n}</span>
              <h3 className="mt-4 font-display text-2xl uppercase text-white">{c.t}</h3>
              <p className="mt-4 text-base leading-relaxed text-white/70">{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Laboratório de Geologia Interativa · placas tectônicas em 3D
      </footer>
    </main>
  );
}
