import { ArrowUpRight, Bot, ChartNoAxesCombined, Command, Cpu, Database, Gauge, Orbit, ShieldCheck, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { COMPANY } from "../lib/company";
import { Atmosphere } from "../components/Atmosphere";

const features = [
  { icon: Bot, label: "Models", text: "Satu pintu ke model AI yang siap dipakai." },
  { icon: ChartNoAxesCombined, label: "Usage", text: "Pantau token dan biaya tanpa menebak." },
  { icon: Terminal, label: "Logs", text: "Telusuri setiap request dari prompt ke output." },
  { icon: Database, label: "Top up", text: "Kelola saldo dan eksperimen dengan tenang." },
];

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <Atmosphere />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          {COMPANY.name}<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/login" className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block">
            Sign in
          </Link>
          <Button asChild size="sm"><Link to="/login"><span className="sm:hidden">Launch</span><span className="hidden sm:inline">Open console</span> <ArrowUpRight /></Link></Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 sm:pt-16 md:px-10 md:pb-20 md:pt-24">
        <section className="grid items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> AI infrastructure online
            </div>
            <h1 className="brand-reveal max-w-3xl font-display text-[clamp(2.75rem,12vw,5rem)] font-extrabold leading-[.95] tracking-[-.06em] md:text-8xl">
              Build beyond<br /><span className="bg-gradient-to-r from-primary via-[var(--signal)] to-[var(--sky)] bg-clip-text text-transparent">the ordinary.</span>
            </h1>
            <p className="rise-in rise-in-delay-1 mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {COMPANY.name} menyatukan akses model, observability, dan billing AI dalam satu mission control untuk builder yang bergerak cepat.
            </p>
            <div className="rise-in rise-in-delay-2 mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto"><Link to="/login">Launch your workspace <ArrowUpRight /></Link></Button>
              <Link to="/login" className="group flex justify-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:justify-start">
                <Command className="size-4 text-primary" /> Enter with API key
              </Link>
            </div>
            <div className="rise-in rise-in-delay-3 mt-10 flex justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-12 sm:justify-start sm:gap-8">
              <span><strong className="block font-mono text-lg text-foreground">01</strong>Control center</span>
              <span><strong className="block font-mono text-lg text-foreground">24/7</strong>Telemetry</span>
              <span><strong className="block font-mono text-lg text-foreground">∞</strong>Possibility</span>
            </div>
          </div>

          <div className="scale-in relative mx-auto aspect-square w-full max-w-[460px] sm:w-[min(100%,460px)]">
            <div className="absolute inset-[12%] rounded-full border border-primary/30 [animation:ringSpin_24s_linear_infinite]" />
            <div className="absolute inset-[23%] rounded-full border border-[var(--sky)]/25 [animation:ringSpinReverse_18s_linear_infinite]" />
            <div className="absolute inset-[34%] rounded-full border border-dashed border-white/15" />
            <div className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/50 bg-card/80 shadow-[0_0_80px_rgba(255,90,31,.22)] backdrop-blur-xl md:size-44">
              <Orbit className="mb-2 size-8 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">Mind Aku</span>
              <span className="mt-1 text-xs text-foreground">AI CORE / 01</span>
            </div>
            <div className="absolute left-[11%] top-[30%] animate-pulse rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md"><Cpu className="size-5 text-[var(--sky)]" /></div>
            <div className="absolute bottom-[18%] right-[12%] animate-pulse rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md [animation-delay:700ms]"><Gauge className="size-5 text-[var(--signal)]" /></div>
            <div className="absolute right-[4%] top-[17%] rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md"><ShieldCheck className="size-5 text-primary" /></div>
          </div>
        </section>

        <section className="mt-24 border-t border-border pt-8">
          <div className="mb-7 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Mission systems</p><h2 className="mt-2 font-display text-2xl font-bold">Everything you need to ship AI.</h2></div><span className="hidden font-mono text-xs text-muted-foreground sm:block">SYS.STATUS / NOMINAL</span></div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, label, text }) => <div key={label} className="group bg-card/80 p-6 transition hover:bg-card"><Icon className="mb-10 size-5 text-primary transition group-hover:scale-110" /><p className="font-display text-lg font-semibold">{label}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}
          </div>
        </section>

        <section className="mt-20 border-t border-border pt-7 sm:mt-24">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">Resources</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground" aria-label="Public resources">
            <Link className="transition hover:text-primary" to="/faq">FAQ</Link>
            <Link className="transition hover:text-primary" to="/refund-policy">Refund policy</Link>
            <Link className="transition hover:text-primary" to="/terms-and-conditions">Terms &amp; conditions</Link>
            <Link className="transition hover:text-primary" to="/kontak">Kontak</Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
