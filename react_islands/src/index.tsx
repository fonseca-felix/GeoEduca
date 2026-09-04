import { useEffect, useState } from "react";
import { VolcanoScene, type ViewKey } from "@/components/volcano/VolcanoScene";
import "./styles.css";

const VIEW_BUTTONS: { key: ViewKey; label: string; hint: string }[] = [
  { key: "orbit", label: "Órbita", hint: "Vista geral do cone" },
  { key: "top", label: "Por cima", hint: "Cratera vista de cima" },
  { key: "inside", label: "Por dentro", hint: "Dentro da cratera, junto ao lago de lava" },
  { key: "cut", label: "Corte transversal", hint: "Interior: conduto e câmara magmática" },
];

const ANATOMY = [
  { n: "01", t: "Câmara magmática", d: "Reservatório de rocha derretida a 700–1300 °C, de 1 a 10 km de profundidade." },
  { n: "02", t: "Conduto principal", d: "Canal vertical por onde o magma sobe quando os gases vencem a rocha." },
  { n: "03", t: "Cratera", d: "Abertura no topo por onde saem lava, cinzas e gases como vapor e enxofre." },
  { n: "04", t: "Lago de lava", d: "Poça incandescente exposta no fundo da cratera, como no vulcão Ambrym." },
  { n: "05", t: "Diques", d: "Fraturas laterais preenchidas por magma que podem abrir crateras secundárias." },
  { n: "06", t: "Coluna de cinzas", d: "Gás e fragmentos quentes lançados a quilômetros de altura durante a erupção." },
];

export default function Index() {
  const [view, setView] = useState<ViewKey>("orbit");
  const [erupting, setErupting] = useState(true);
  const cut = view === "cut";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0d0a0b] text-foreground flex flex-col items-center">
      <header className="w-full max-w-4xl px-6 sm:px-8 pt-16 pb-8 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.28em] text-[#cca43b]">
          Laboratório de Geologia · Módulo 04
        </p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl uppercase leading-[0.9] text-white">
          Dentro de um <span className="text-[#cca43b]">vulcão</span>
        </h1>
        <p className="mt-4 max-w-2xl text-white/60 mx-auto sm:mx-0">
          Modelo 3D interativo: arraste para girar em 360°, use a roda do mouse para zoom e troque
          de câmera para explorar as camadas.
        </p>
      </header>

      <section className="w-full max-w-4xl px-6 sm:px-8">
        <div className="relative w-full h-[60vh] sm:h-[65vh] min-h-[450px] overflow-hidden rounded-[2rem] bg-black shadow-2xl">
          {mounted ? (
            <VolcanoScene view={view} erupting={erupting} cut={cut} />
          ) : (
            <div className="grid h-full place-items-center text-white/50">
              Carregando simulação...
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 p-6">
            <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
              {VIEW_BUTTONS.map((b) => (
                <button
                  key={b.key}
                  title={b.hint}
                  onClick={() => setView(b.key)}
                  className={`rounded-full border px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur-md ${
                    view === b.key
                      ? "border-amber-500 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                      : "border-white/20 bg-black/60 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setErupting((e) => !e)}
              className={`pointer-events-auto mt-2 rounded-full border px-8 py-3 text-sm font-bold uppercase tracking-widest backdrop-blur-xl transition-all duration-300 shadow-2xl ${
                erupting 
                ? "border-red-500 bg-red-500/20 text-red-200 hover:bg-red-500/40" 
                : "border-amber-500 bg-amber-500/20 text-amber-400 hover:bg-amber-500/40"
              }`}
            >
              {erupting ? "Acalmar vulcão" : "Iniciar erupção"}
            </button>
          </div>

          <p className="pointer-events-none absolute right-6 top-6 text-[0.7rem] uppercase tracking-[0.2em] text-white/50 drop-shadow-md">
            arraste para girar · scrool para zoom
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:gap-10 sm:grid-cols-3">
          {[
            { k: "Câmera", v: VIEW_BUTTONS.find((b) => b.key === view)!.label },
            { k: "Estado", v: erupting ? "Em atividade" : "Adormecido" },
            { k: "Lago de lava", v: "≈ 1100 °C" },
          ].map((r) => (
            <div key={r.k} className="rounded-[1.5rem] bg-[#1a2332]/40 p-8 shadow-lg backdrop-blur-sm transition-all hover:bg-[#1a2332]/60 text-center sm:text-left">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#cca43b]">
                {r.k}
              </span>
              <strong className="mt-3 block font-display text-2xl uppercase text-white">{r.v}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-4xl px-6 sm:px-8 mt-24 mb-32">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#cca43b]">Anatomia</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl uppercase text-white">As camadas por dentro</h2>
        </div>
        <div className="mt-16 grid gap-10 sm:gap-12 sm:grid-cols-2">
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
        Laboratório de Geologia Interativa · vulcão em 3D
      </footer>
    </main>
  );
}
