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
  { icon: Code, title: "Live Tester", desc: "Try every endpoint directly in the browser. No Postman needed." },
  { icon: Globe, title: "No Rate Surprise", desc: "Generous limits. No hidden throttles. Just build." },
  { icon: Cpu, title: "Blazing Fast", desc: "Edge-optimized proxy. Sub-50ms median response." },
];

const CODE_EXAMPLES = [
  {
    label: "AI Chat",
    lang: "js",
    code: `const res = await fetch(
  \`${DYNAMIC_BASE}/api/ai/aichat
    ?prompt=hello\`
);
const data = await res.json();
console.log(data.result);`,
  },
  {
    label: "Text to Speech",
    lang: "js",
    code: `const res = await fetch(
  \`${DYNAMIC_BASE}/api/tts/tts
    ?text=Hello World
    &voice=en-US\`
);
// Returns audio/mpeg blob
const audio = await res.blob();`,
  },
  {
    label: "Media Fetch",
    lang: "js",
    code: `const res = await fetch(
  \`${DYNAMIC_BASE}/api/downloader/ytmp3
    ?url=https://youtube.com/...\`
);
const { download_url } = await res.json();`,
  },
];

function Ticker() {
  return (
    <div className="relative w-full overflow-hidden py-3 select-none">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="flex animate-ticker gap-4 whitespace-nowrap">
        {[...CATEGORY_PILLS, ...CATEGORY_PILLS].map((cat, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-mono text-primary/70 font-medium shrink-0">
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
      const duration = 1200;
      const step = Math.ceil(end / (duration / 16));
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

export default function Home() {
  const { data: statusData, isLoading: isLoadingStatus } = useGetApiStatus();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();
  const [activeTab, setActiveTab] = useState(0);

  const version = statusData?.version ?? "1.0.0";
  const totalEndpoints = statusData?.totalEndpoints ?? 545;
  const totalCategories = categoriesData?.total ?? 19;

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 -left-32 h-64 w-64 rounded-full bg-blue-500/8 blur-[80px]" />
        <div className="pointer-events-none absolute top-20 -right-24 h-48 w-48 rounded-full bg-primary/6 blur-[60px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-mono text-primary mb-8 backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary inline-block animate-pulse" />
              v{version} · Free to use · No key required
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-balance leading-[0.9]">
              <span className="block text-foreground">One API.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-300 to-blue-400">
                Everything.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              545+ endpoints across AI, anime, media, voice synthesis, and more.
              One base URL. Zero friction. Start building in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/docs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 font-mono text-sm group bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Terminal className="mr-2 h-4 w-4" />
                  Explore Endpoints
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/status" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 border-border/50 hover:bg-card hover:border-primary/30 backdrop-blur-sm">
                  <Activity className="mr-2 h-4 w-4" />
                  Platform Status
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Ticker strip */}
        <div className="mt-16 border-y border-border/30 bg-card/20 backdrop-blur-sm">
          <Ticker />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 md:py-16 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30">
            {[
              { label: "Endpoints", value: isLoadingStatus ? null : totalEndpoints, suffix: "+" },
              { label: "Categories", value: isLoadingCategories ? null : totalCategories, suffix: "" },
              { label: "Uptime", value: "99.9", suffix: "%" },
              { label: "Avg Latency", value: "<50", suffix: "ms" },
            ].map((stat, i) => (
              <div key={i} className="bg-background/80 backdrop-blur-sm px-6 py-8 text-center group hover:bg-card transition-colors">
                <div className="text-3xl md:text-4xl font-black font-mono text-primary mb-2 group-hover:scale-105 transition-transform">
                  {stat.value === null ? (
                    <Skeleton className="h-10 w-24 mx-auto" />
                  ) : (
                    <><CountUp target={typeof stat.value === "number" ? stat.value : stat.value} />{stat.suffix}</>
                  )}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE + FEATURES ── */}
      <section className="py-20 md:py-28 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">

          {/* Left — Terminal */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-emerald-500/20 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm" />
              <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  </div>
                  {/* Tabs */}
                  <div className="flex items-center gap-1 ml-4 overflow-x-auto scrollbar-none">
                    {CODE_EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setActiveTab(i)} className={"px-3 py-1 rounded-md text-xs font-mono transition-all " + (activeTab === i ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Code */}
                <div className="p-5 md:p-7 min-h-[180px]">
                  <pre className="font-mono text-sm leading-7 overflow-x-auto text-muted-foreground">
                    <code dangerouslySetInnerHTML={{ __html: CODE_EXAMPLES[activeTab].code
                      .replace(/`([^`]*)`/g, '<span class="text-green-400">$1</span>')
                      .replace(/(const|await|async|let|var)/g, '<span class="text-purple-400">$1</span>')
                      .replace(/(fetch|json|blob|console\.log)/g, '<span class="text-blue-400">$1</span>')
                      .replace(/(res|data|audio)/g, '<span class="text-sky-300">$1</span>')
                    }} />
                  </pre>
                </div>
                {/* Response preview */}
                <div className="border-t border-border/40 px-5 md:px-7 py-4 bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-green-400">200 OK · ~38ms</span>
                  </div>
                  <pre className="font-mono text-xs text-muted-foreground/70 leading-relaxed">
{`{ "status": true, "creator": "trustbit",
  "result": "Hello! How can I help you?" }`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Features */}
          <div>
            <div className="mb-10">
              <span className="text-xs font-mono uppercase tracking-widest text-primary/70">Why Trustbit</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Built for builders<br />who hate waiting.
              </h2>
              <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                No OAuth flows. No credit card forms. No quota emails.
                Just copy a URL and ship.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="group rounded-xl border border-border/40 bg-card/30 p-5 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 text-primary group-hover:bg-primary/20 transition-colors">
                    <f.icon size={17} />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY GRID ── */}
      <section className="py-20 md:py-24 border-t border-border/30 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-primary/70">Categories</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Everything in one place.</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              From AI to anime to media downloading — all behind one URL.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {[
              { icon: Bot, name: "AI" },
              { icon: Image, name: "Anime" },
              { icon: Download, name: "Media Fetch" },
              { icon: Music, name: "Text to Speech" },
              { icon: Search, name: "Profile Lookup" },
              { icon: Layers, name: "Image Tools" },
              { icon: Globe, name: "Search Engine" },
              { icon: MessageSquare, name: "Translation" },
              { icon: Activity, name: "Weather" },
              { icon: Zap, name: "Entertainment" },
              { icon: Code, name: "Utilities" },
              { icon: Cpu, name: "Math & Logic" },
              { icon: Shield, name: "News" },
              { icon: Terminal, name: "Social Tools" },
              { icon: Globe, name: "Currency" },
              { icon: Music, name: "Lyrics" },
              { icon: MessageSquare, name: "Quotes" },
              { icon: Zap, name: "Facts" },
              { icon: Image, name: "QR Code" },
            ].map((cat, i) => (
              <Link href="/docs" key={i}>
                <div className="group rounded-xl border border-border/30 bg-card/20 hover:bg-card hover:border-primary/30 transition-all duration-300 p-4 text-center cursor-pointer hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5">
                  <div className="mx-auto mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary transition-all">
                    <cat.icon size={16} />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/docs">
              <Button variant="outline" className="font-mono text-sm border-border/50 hover:border-primary/30 hover:bg-card">
                View all {totalEndpoints}+ endpoints <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 md:py-32 relative overflow-hidden border-t border-border/30">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 blur-[100px] rounded-full" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-5 text-balance">
            Start building{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">right now.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            No account. No key. No limit on exploration.
            Read the docs, run the endpoints live, ship something cool.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/docs">
              <Button size="lg" className="h-13 px-10 font-mono shadow-xl shadow-primary/20 group">
                <Terminal className="mr-2 h-4 w-4" />
                Open the Docs
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="https://t.me/TrustBitOfficial" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="h-13 px-10 border-border/50 hover:bg-card hover:border-primary/30">
                Join Community
              </Button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
