import { Link } from "wouter";
import { ArrowRight, Terminal, Zap, Layers, Code, Shield, Activity, Globe, Cpu, Music, Image, Download, Search, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiStatus, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";

const DYNAMIC_BASE = typeof window !== "undefined" ? window.location.origin : "https://trustbit.app";

const CATEGORY_PILLS = [
  "AI Chat", "Anime", "Media Fetch", "Text to Speech", "Profile Lookup",
  "Image Tools", "Search Engine", "Translation", "Weather", "News",
  "Entertainment", "Social Tools", "Utilities", "Math", "QR Code",
  "Currency", "Lyrics", "Quotes", "Facts",
];

const FEATURES = [
  { icon: Zap, title: "Zero Auth to Start", desc: "Hit any endpoint instantly — no key, no signup, no wait." },
  { icon: Layers, title: "19 Categories", desc: "AI, TTS, anime, media, tools and more under one roof." },
  { icon: Shield, title: "Always On", desc: "99.9% uptime backed by redundant global infrastructure." },
  { icon: Code, title: "Live Tester", desc: "Try every endpoint directly in the browser." },
  { icon: Globe, title: "No Rate Surprise", desc: "Generous limits. No hidden throttles. Just build." },
  { icon: Cpu, title: "Blazing Fast", desc: "Edge-optimized proxy. Sub-50ms median response." },
];

const CODE_EXAMPLES = [
  {
    label: "AI Chat",
    code: `const res = await fetch(\n  \`${DYNAMIC_BASE}/api/ai/aichat\n    ?prompt=hello\`\n);\nconst { result } = await res.json();\nconsole.log(result);`,
  },
  {
    label: "TTS",
    code: `const res = await fetch(\n  \`${DYNAMIC_BASE}/api/tts/tts\n    ?text=Hello+World\n    &voice=en-US\`\n);\n// Returns audio/mpeg\nconst audio = await res.blob();`,
  },
  {
    label: "Download",
    code: `const res = await fetch(\n  \`${DYNAMIC_BASE}/api/downloader/ytmp3\n    ?url=https://youtube.com/...\`\n);\nconst { download_url } = await res.json();`,
  },
];

const CATS = [
  { icon: Bot, name: "AI Suite" }, { icon: Image, name: "Anime Hub" },
  { icon: Download, name: "Media Fetch" }, { icon: Music, name: "Voice Synth" },
  { icon: Search, name: "Profile Lookup" }, { icon: Layers, name: "Image Studio" },
  { icon: Globe, name: "Search Engine" }, { icon: MessageSquare, name: "Dev Tools" },
  { icon: Activity, name: "Web Capture" }, { icon: Zap, name: "Discovery" },
  { icon: Code, name: "Font Forge" }, { icon: Cpu, name: "GameZone" },
  { icon: Shield, name: "CinemaDB" }, { icon: Terminal, name: "Link Shrink" },
  { icon: Globe, name: "Audio Vault" }, { icon: Music, name: "Text FX" },
  { icon: MessageSquare, name: "Live Sports" }, { icon: Zap, name: "SMS Inbox" },
  { icon: Image, name: "AI Imaging" },
];

function Ticker() {
  return (
    <div className="relative w-full overflow-hidden py-3 select-none">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="flex animate-ticker gap-3 whitespace-nowrap">
        {[...CATEGORY_PILLS, ...CATEGORY_PILLS].map((cat, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-mono text-primary/70 font-medium shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/50 inline-block" />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}

function CountUp({ target }: { target: number | string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof target !== "number" || started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      started.current = true;
      observer.disconnect();
      let start = 0;
      const end = target;
      const step = Math.ceil(end / (1200 / 16));
      const timer = setInterval(() => {
        start = Math.min(start + step, end);
        setVal(start);
        if (start >= end) clearInterval(timer);
      }, 16);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  if (typeof target === "string") return <span>{target}</span>;
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

function highlight(code: string) {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(`[^`]*`)/g, '<span class="text-green-400">$1</span>')
    .replace(/\b(const|await|async|let|var)\b/g, '<span class="text-purple-400">$1</span>')
    .replace(/\b(fetch|json|blob|log)\b/g, '<span class="text-blue-400">$1</span>')
    .replace(/\b(res|data|audio|result)\b/g, '<span class="text-sky-300">$1</span>');
}

export default function Home() {
  const { data: statusData, isLoading: isLoadingStatus } = useGetApiStatus();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();
  const [activeTab, setActiveTab] = useState(0);

  const version = statusData?.version ?? "1.0.0";
  const totalEndpoints = statusData?.totalEndpoints ?? 545;

  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-0 md:pt-28">
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.035)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:48px_48px]" />
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 sm:h-[400px] sm:w-[500px] md:h-[500px] md:w-[700px] rounded-full bg-primary/10 blur-[80px] sm:blur-[120px]" />
        <div className="pointer-events-none absolute top-32 -left-20 h-40 w-40 md:h-64 md:w-64 rounded-full bg-blue-500/8 blur-[60px] md:blur-[80px]" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs sm:text-sm font-mono text-primary mb-7 md:mb-10 backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary inline-block animate-pulse" />
              v{version} · Free · No key required
            </div>

            {/* Headline — scales down for small phones */}
            <h1 className="text-[2.6rem] leading-[0.92] sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-5 md:mb-6">
              <span className="block text-foreground">One API.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-300 to-blue-400">
                Everything.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed px-2">
              545+ endpoints across AI, anime, media, voice synthesis, and more.
              One base URL. Zero friction. Start building in seconds.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col xs:flex-row items-center justify-center gap-3 px-4 sm:px-0">
              <Link href="/docs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-6 sm:px-8 font-mono text-sm group bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Terminal className="mr-2 h-4 w-4 shrink-0" />
                  Explore Endpoints
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 shrink-0" />
                </Button>
              </Link>
              <Link href="/status" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 sm:px-8 border-border/50 hover:bg-card hover:border-primary/30">
                  <Activity className="mr-2 h-4 w-4 shrink-0" />
                  Platform Status
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Ticker strip */}
        <div className="mt-12 md:mt-16 border-y border-border/30 bg-card/20 backdrop-blur-sm">
          <Ticker />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 md:py-16 border-b border-border/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-xl sm:rounded-2xl overflow-hidden border border-border/30">
            {[
              { label: "Endpoints", value: isLoadingStatus ? null : totalEndpoints, suffix: "+" },
              { label: "Categories", value: isLoadingCategories ? null : (categoriesData?.total ?? 19), suffix: "" },
              { label: "Uptime", value: "99.9", suffix: "%" },
              { label: "Avg Latency", value: "<50", suffix: "ms" },
            ].map((stat, i) => (
              <div key={i} className="bg-background/80 px-3 sm:px-6 py-6 sm:py-8 text-center group hover:bg-card/80 transition-colors">
                <div className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-primary mb-1 sm:mb-2">
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    <><CountUp target={typeof stat.value === "number" ? stat.value : stat.value} />{stat.suffix}</>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE + FEATURES ── */}
      <section className="py-14 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">

          {/* Terminal — shows first on mobile, sticky on desktop */}
          <div className="order-1 lg:order-none lg:sticky lg:top-24">
            <div className="relative group">
              <div className="absolute -inset-px rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/40 via-emerald-500/20 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm" />
              <div className="relative rounded-xl sm:rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/50 bg-muted/20">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/70" />
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/70" />
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/70" />
                  </div>
                  {/* Tabs — scrollable on mobile */}
                  <div className="flex items-center gap-1 ml-2 sm:ml-4 overflow-x-auto scrollbar-none">
                    {CODE_EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setActiveTab(i)} className={"px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono whitespace-nowrap transition-all " + (activeTab === i ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Code */}
                <div className="p-4 sm:p-6 min-h-[140px] sm:min-h-[160px] overflow-x-auto">
                  <pre className="font-mono text-[11px] sm:text-sm leading-6 sm:leading-7 text-muted-foreground">
                    <code dangerouslySetInnerHTML={{ __html: highlight(CODE_EXAMPLES[activeTab].code) }} />
                  </pre>
                </div>
                {/* Mock response */}
                <div className="border-t border-border/40 px-4 sm:px-6 py-3 sm:py-4 bg-muted/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-mono text-green-400">200 OK · ~38ms</span>
                  </div>
                  <pre className="font-mono text-[10px] sm:text-xs text-muted-foreground/70 leading-relaxed overflow-x-auto">
{`{ "status": true, "creator": "trustbit",\n  "result": "Hello! How can I help?" }`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="order-2 lg:order-none">
            <div className="mb-7 md:mb-10">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary/70">Why Trustbit</span>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Built for builders<br className="hidden sm:block" /> who hate waiting.
              </h2>
              <p className="mt-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                No OAuth flows. No credit card forms. No quota emails.
                Just copy a URL and ship.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="group rounded-xl border border-border/40 bg-card/30 p-4 sm:p-5 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                  <div className="mb-2.5 sm:mb-3 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 text-primary group-hover:bg-primary/20 transition-colors">
                    <f.icon size={15} />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY GRID ── */}
      <section className="py-14 md:py-24 border-t border-border/30 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary/70">Categories</span>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">Everything in one place.</h2>
            <p className="mt-2 sm:mt-3 text-muted-foreground max-w-lg mx-auto text-xs sm:text-sm md:text-base px-2">
              From AI to anime to media downloading — all behind one URL.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 max-w-5xl mx-auto">
            {CATS.map((cat, i) => (
              <Link href="/docs" key={i}>
                <div className="group rounded-lg sm:rounded-xl border border-border/30 bg-card/20 hover:bg-card hover:border-primary/30 transition-all duration-300 p-2.5 sm:p-4 text-center cursor-pointer hover:-translate-y-0.5">
                  <div className="mx-auto mb-1.5 sm:mb-2.5 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-primary/8 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary transition-all">
                    <cat.icon size={13} className="sm:hidden" />
                    <cat.icon size={16} className="hidden sm:block" />
                  </div>
                  <p className="text-[9px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Link href="/docs">
              <Button variant="outline" size="sm" className="font-mono text-xs sm:text-sm border-border/50 hover:border-primary/30 hover:bg-card">
                View all {totalEndpoints}+ endpoints <ArrowRight className="ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-32 relative overflow-hidden border-t border-border/30">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.025)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:48px_48px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] sm:w-[500px] sm:h-[250px] md:w-[600px] md:h-[300px] bg-primary/8 blur-[80px] sm:blur-[100px] rounded-full" />
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 sm:mb-5 text-balance">
            Start building{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">right now.</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-8 md:mb-10 max-w-lg mx-auto px-2">
            No account. No key. No limit on exploration.
            Read the docs, run the endpoints live, ship something cool.
          </p>
          <div className="flex flex-col xs:flex-row items-center justify-center gap-3 px-4 sm:px-0">
            <Link href="/docs" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 font-mono shadow-xl shadow-primary/20 group">
                <Terminal className="mr-2 h-4 w-4 shrink-0" />
                Open the Docs
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </Button>
            </Link>
            <a href="https://t.me/TrustBitOfficial" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-border/50 hover:bg-card hover:border-primary/30">
                Join Community
              </Button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
