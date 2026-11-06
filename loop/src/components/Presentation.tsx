import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Lenis from "lenis";
import { Globe } from "./Globe";
import { exportProjectZip } from "@/lib/export-zip";
import copero from "@/assets/copero.png";

const N = 7;
const LABELS = ["Início", "Propósito", "Jogos", "Copero", "Professor", "Tecnologia", "Fechamento"];
const WORDS = ["GEOGRAFIA", "BRASIL", "EXPLORAÇÃO", "METODOLOGIA", "CARTOGRAFIA", "RELEVO", "DESCOBERTA"];

const sp = (speed: number) => ({ "--speed": speed }) as CSSProperties;

function Pin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 34" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z" fill="var(--gold)" />
      <circle cx="12" cy="12" r="4.5" fill="var(--navy-deep)" />
    </svg>
  );
}
function Compass({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--gold)" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="2 3" />
      <path d="M50 8 L57 50 L50 92 L43 50Z" fill="var(--gold)" opacity="0.9" />
      <path d="M8 50 L50 44 L92 50 L50 56Z" fill="var(--gold)" opacity="0.45" />
      <text x="50" y="22" textAnchor="middle" fontSize="9" fill="var(--paper)" fontFamily="Space Grotesk">N</text>
    </svg>
  );
}
function Ruler({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 24" className={className} aria-hidden>
      <rect x="0" y="6" width="50" height="8" fill="var(--paper)" /><rect x="50" y="6" width="50" height="8" fill="var(--navy)" stroke="var(--paper)" />
      <rect x="100" y="6" width="50" height="8" fill="var(--paper)" /><rect x="150" y="6" width="50" height="8" fill="var(--navy)" stroke="var(--paper)" />
      <text x="0" y="24" fontSize="7" fill="var(--paper)">0</text><text x="190" y="24" fontSize="7" fill="var(--paper)">500km</text>
    </svg>
  );
}
function Plate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <path d="M5 30 L50 10 L115 25 L105 60 L40 72 L10 55Z" fill="var(--forest)" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M5 30 L10 55 L40 72 L40 78 L8 61 L2 36Z" fill="var(--navy)" stroke="var(--gold)" strokeWidth="1" />
    </svg>
  );
}

function Background({ seed }: { seed: number }) {
  const dots = Array.from({ length: 24 }, (_, i) => ({ l: (i * 37 + seed * 13) % 100, t: (i * 53 + seed * 29) % 100, d: (i % 5) * 0.8 }));
  return (
    <div className="layer topo-bg" style={sp(-0.5)}>
      <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <ellipse key={k} cx={30 + seed * 7 % 40} cy={55} rx={12 + k * 9} ry={8 + k * 6} fill="none" stroke="var(--gold)" strokeWidth="0.08" />
        ))}
      </svg>
      {dots.map((d, i) => (
        <span key={i} className="animate-twinkle absolute h-1 w-1 rounded-full bg-gold glow-gold" style={{ left: `${d.l}%`, top: `${d.t}%`, animationDelay: `${d.d}s` }} />
      ))}
    </div>
  );
}

function Watermark({ i }: { i: number }) {
  const w = WORDS[i];
  return (
    <div className="layer flex flex-col justify-center gap-4 overflow-hidden" style={sp(-0.3)}>
      <div className="marquee" style={{ transform: `translateX(calc(var(--p,0) * -35vw - 10vw))` }}>{w} · {w} · {w}</div>
      <div className="marquee" style={{ transform: `translateX(calc(var(--p,0) * 35vw - 40vw))` }}>{WORDS[(i + 1) % N]} · {WORDS[(i + 1) % N]}</div>
    </div>
  );
}

function Foreground({ i }: { i: number }) {
  const v = i % 3;
  return (
    <div className="layer pointer-events-none z-30" style={sp(0.9)}>
      <div className="tilt absolute" style={{ left: v === 0 ? "6%" : "80%", top: "70%" }}><Pin className="h-16 w-12 drop-shadow-2xl" /></div>
      <div className="tilt absolute" style={{ left: v === 1 ? "8%" : "86%", top: v === 2 ? "12%" : "82%" }}><Compass className="h-28 w-28 animate-[spin_30s_linear_infinite] opacity-80" /></div>
      <div className="tilt absolute" style={{ left: "60%", top: v === 0 ? "90%" : "8%" }}><Ruler className="w-44 opacity-70" /></div>
      <div className="tilt absolute" style={{ left: v === 2 ? "4%" : "40%", top: v === 1 ? "6%" : "95%" }}><Plate className="w-32 opacity-80" /></div>
    </div>
  );
}

function Slide({ i, children }: { i: number; children: ReactNode }) {
  const k = i % N;
  return (
    <section data-slide className="relative h-screen w-full overflow-hidden">
      <Background seed={k} />
      <Watermark i={k} />
      <div className="layer z-20 flex items-center" style={sp(0.15)}>
        <div className="mx-auto w-full max-w-6xl px-6 md:px-12">{children}</div>
      </div>
      <Foreground i={k} />
    </section>
  );
}

const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 font-display text-sm uppercase tracking-[0.3em] text-gold">{children}</p>
);

function GlassCard({ title, body, tag, style }: { title: string; body: string; tag?: string; style?: CSSProperties }) {
  return (
    <div className="glass tilt p-6" style={style}>
      {tag && <span className="mb-3 inline-block rounded-full border border-gold/40 px-3 py-1 font-display text-xs text-gold">{tag}</span>}
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Hero() {
  return (
    <div className="reveal text-center">
      <Kicker>Plataforma gamificada de Geografia</Kicker>
      <h1 className="text-6xl font-black leading-[0.9] tracking-tight md:text-8xl">
        Geo<span className="text-gold-gradient">Educa</span>
      </h1>
      <p className="mt-4 font-display text-2xl font-medium md:text-3xl">O Brasil nas Pistas</p>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        A plataforma gamificada que transforma o ensino de Geografia em uma expedição interativa.
      </p>
      <p className="mt-10 text-xs uppercase tracking-[0.4em] text-gold/70">role para explorar ↓</p>
    </div>
  );
}

const SLIDES: (() => ReactNode)[] = [
  Hero,
  () => (
    <div className="max-w-xl">
      <div className="reveal">
        <Kicker>02 · O Propósito</Kicker>
        <h2 className="text-5xl font-black leading-none md:text-6xl">Da Teoria Abstrata à <span className="text-gold-gradient">Exploração Viva</span></h2>
      </div>
      <div className="reveal mt-10 grid gap-5">
        <GlassCard tag="Paisagens" title="Exploração de Paisagens Reais" body="Alunos percorrem ruas, biomas e cidades brasileiras em imagens reais." />
        <GlassCard tag="Dedução" title="Investigação por Dedução" body="Pistas de clima, vegetação e sinalização viram raciocínio geográfico." style={{ marginLeft: "3rem" }} />
        <GlassCard tag="Dados" title="Métricas em Tempo Real" body="Cada palpite gera dados de precisão e evolução da turma." style={{ marginLeft: "1.5rem" }} />
      </div>
    </div>
  ),
  () => (
    <div className="ml-auto max-w-3xl">
      <div className="reveal text-right">
        <Kicker>03 · Universo de Jogos</Kicker>
        <h2 className="text-5xl font-black md:text-6xl">Ecossistema <span className="text-gold-gradient">Gamificado</span></h2>
      </div>
      <div className="reveal mt-10 grid gap-4 sm:grid-cols-2">
        <GlassCard tag="360°" title="BrazilGuessr" body="Exploração em Google Street View com palpite em mapa e precisão em quilômetros." />
        <GlassCard tag="Enigmas" title="Detetive Brasil" body="Enigmas geográficos, coordenadas e patrimônio histórico." />
        <GlassCard tag="Cartografia" title="GeoBr & GeoMundo" body="Capitais, relevo e geopolítica em desafios de mapa." />
        <GlassCard tag="Biomas" title="Missão Brasil" body="Jornadas pelos biomas brasileiros." />
        <GlassCard tag="3D" title="Placas Tectônicas 3D" body="Modelagem tridimensional da litosfera." style={{ gridColumn: "1 / -1" }} />
      </div>
    </div>
  ),
  () => (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="reveal">
        <Kicker>04 · Mascote</Kicker>
        <h2 className="text-5xl font-black md:text-6xl">Copero <span className="text-gold-gradient">Explorador</span></h2>
        <p className="mt-6 text-lg text-muted-foreground">O guia que acompanha cada expedição, com curiosidades integradas ao IBGE Educa.</p>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="glass tilt p-5"><p className="font-display text-4xl font-black text-gold">27</p><p className="text-sm text-muted-foreground">unidades federativas</p></div>
          <div className="glass tilt p-5"><p className="font-display text-4xl font-black text-gold">6</p><p className="text-sm text-muted-foreground">biomas brasileiros</p></div>
        </div>
      </div>
      <div className="tilt relative" style={{ transform: "translateZ(80px)" }}>
        <img src={copero} alt="Copero Explorador, capivara mascote do GeoEduca" width={1024} height={1024} loading="lazy" className="animate-floaty mx-auto w-full max-w-sm drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
      </div>
    </div>
  ),
  () => (
    <div className="max-w-3xl">
      <div className="reveal">
        <Kicker>05 · Inteligência Pedagógica</Kicker>
        <h2 className="text-5xl font-black md:text-6xl">Painel do <span className="text-gold-gradient">Professor</span></h2>
      </div>
      <div className="reveal mt-10 grid gap-4 md:grid-cols-3">
        <div className="glass tilt p-6 md:col-span-2">
          <p className="mb-4 font-display text-sm text-muted-foreground">Precisão média por turma</p>
          <div className="flex h-36 items-end gap-3">
            {[45, 70, 55, 88, 62, 95, 78].map((h, i) => (
              <div key={i} className="bar flex-1 rounded-t bg-gold/80" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        </div>
        <div className="glass tilt p-6"><p className="font-display text-5xl font-black text-gold">10</p><p className="text-sm text-muted-foreground">tentativas diárias por aluno</p></div>
        <div className="glass tilt p-6"><p className="font-display text-lg font-bold">Ranking por salas</p><p className="text-sm text-muted-foreground">Competição saudável entre turmas.</p></div>
        <div className="glass tilt p-6 md:col-span-2"><p className="font-display text-lg font-bold">Acompanhamento de turmas</p><p className="text-sm text-muted-foreground">Evolução individual, acertos e pontos de atenção.</p></div>
      </div>
    </div>
  ),
  () => (
    <div className="text-center">
      <div className="reveal">
        <Kicker>06 · Tecnologia</Kicker>
        <h2 className="text-5xl font-black md:text-6xl">Tecnologia de <span className="text-gold-gradient">Ponta</span></h2>
      </div>
      <div className="reveal mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4">
        {[["Leaflet", "Mapas interativos"], ["Three.js", "Visualização 3D"], ["Protomaps", "Tiles vetoriais"], ["Node.js", "Servidor"], ["Firebase", "Dados em tempo real"]].map(([t, d]) => (
          <div key={t} className="glass tilt w-44 p-5"><p className="font-display text-2xl font-bold text-gold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
        ))}
      </div>
    </div>
  ),
  () => (
    <div className="reveal text-center">
      <Kicker>07 · GeoEduca</Kicker>
      <h2 className="mx-auto max-w-4xl text-5xl font-black leading-tight md:text-7xl">
        Cada paisagem é uma aula. <span className="text-gold-gradient">Cada palpite, uma descoberta.</span>
      </h2>
      <p className="mt-10 text-xs uppercase tracking-[0.4em] text-gold/70">continue rolando · a expedição recomeça</p>
    </div>
  ),
];

export function Presentation() {
  const progress = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);
  const [active, setActive] = useState(0);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    let last = -1;

    const update = (scroll: number) => {
      const vh = window.innerHeight;
      if (scroll >= N * vh) { lenis.scrollTo(scroll - N * vh, { immediate: true, force: true }); return; }
      progress.current = scroll / (N * vh);
      sections.forEach((s, i) => {
        const p = Math.max(-1.5, Math.min(1.5, (scroll - i * vh) / vh));
        s.style.setProperty("--p", p.toFixed(4));
        s.classList.toggle("in-view", Math.abs(p) < 0.6);
      });
      const a = Math.round(scroll / vh) % N;
      if (a !== last) { last = a; setActive(a); }
    };
    lenis.on("scroll", ({ scroll }: { scroll: number }) => update(scroll));
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && lenis.scroll < 2) lenis.scrollTo(N * window.innerHeight - 1, { immediate: true, force: true });
    };
    const onMouse = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      document.documentElement.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", onMouse);
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    update(window.scrollY);
    const auto = window.setInterval(() => {
      const vh = window.innerHeight;
      const next = Math.round(lenis.scroll / vh) + 1;
      lenis.scrollTo(next * vh, { duration: 1.6, force: true });
    }, 6000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(auto);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMouse);
      lenis.destroy();
    };
  }, []);

  const go = (i: number) => lenisRef.current?.scrollTo(i * window.innerHeight, { duration: 1.6 });
  const download = async () => { setZipping(true); try { await exportProjectZip(); } finally { setZipping(false); } };

  return (
    <main className="relative bg-navy-deep">
      <Globe progressRef={progress} />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--navy-deep)_95%)]" />

      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-bold">Geo<span className="text-gold">Educa</span></span>
        <button onClick={download} disabled={zipping} className="glass glow-gold rounded-full px-5 py-2.5 font-display text-sm font-semibold text-gold transition hover:scale-105 disabled:opacity-60">
          {zipping ? "Gerando…" : "📦 Baixar Código (.ZIP)"}
        </button>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-50 h-1 bg-paper/10"><div key={active} className="progress-bar h-full bg-gold glow-gold" /></div>

      <nav className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-4" aria-label="Slides">
        {LABELS.map((l, i) => (
          <button key={l} onClick={() => go(i)} className="group flex items-center justify-end gap-3" aria-label={l}>
            <span className={`font-display text-xs uppercase tracking-widest transition ${active === i ? "text-gold opacity-100" : "opacity-0 group-hover:opacity-70"}`}>{l}</span>
            <span className={`block rounded-full transition-all duration-500 ${active === i ? "h-3 w-3 bg-gold glow-gold" : "h-2 w-2 bg-paper/30 group-hover:scale-150"}`} />
          </button>
        ))}
      </nav>

      <div className="relative z-10">
        {[...SLIDES, SLIDES[0]!].map((S, i) => (
          <Slide key={i} i={i}><S /></Slide>
        ))}
      </div>
    </main>
  );
}
