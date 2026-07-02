import { useState, useMemo, useRef } from "react";
import { useListEndpoints, useListCategories, useGetApiStatus } from "@workspace/api-client-react";
import {
  Search, Copy, Check, Terminal, Zap, Send, ChevronDown, ChevronUp,
  Image as ImageIcon, Volume2, Loader2, XCircle, Clock,
  BookOpen, KeyRound, CreditCard, UserPlus, Globe, Info,
  Brain, Download, Mic, Film, Gamepad2, Wand2, Layers, Link2, AlignLeft, Phone,
  ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Star, Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://trustbit.app";

interface Param {
  name: string;
  required: boolean;
}

function parseParams(path: string): Param[] {
  const qIdx = path.indexOf("?");
  if (qIdx === -1) return [];
  const qs = path.slice(qIdx + 1);
  return qs.split("&").map((part) => {
    const eqIdx = part.indexOf("=");
    const rawKey = eqIdx === -1 ? part : part.slice(0, eqIdx);
    const required = !rawKey.endsWith("?");
    const name = required ? rawKey : rawKey.slice(0, -1);
    return { name, required };
  }).filter((p) => p.name.length > 0);
}

function buildUrl(basePath: string, values: Record<string, string>): string {
  const pathOnly = basePath.split("?")[0];
  const apiPath = pathOnly.startsWith("/api") ? pathOnly : "/api" + pathOnly;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v.trim()) params.set(k, v.trim());
  }
  const qs = params.toString();
  return BASE_URL + apiPath + (qs ? "?" + qs : "");
}

type ResponseState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "json"; status: number; ms: number; data: unknown }
  | { type: "image"; status: number; ms: number; url: string; contentType: string }
  | { type: "audio"; status: number; ms: number; url: string }
  | { type: "error"; status: number; ms: number; message: string };

function JsonRenderer({ data }: { data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n");
  return (
    <pre className="text-xs font-mono leading-5 overflow-auto max-h-80 text-green-400/90 whitespace-pre-wrap break-all">
      {lines.map((line, i) => (
        <span key={i} className="block hover:bg-white/5 px-1 rounded">{line}</span>
      ))}
    </pre>
  );
}

function TryItPanel({ path }: { path: string }) {
  const params = useMemo(() => parseParams(path), [path]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, ""]))
  );
  const [response, setResponse] = useState<ResponseState>({ type: "idle" });
  const objectUrlRef = useRef<string | null>(null);

  const setValue = (name: string, val: string) =>
    setValues((prev) => ({ ...prev, [name]: val }));

  const handleSend = async () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setResponse({ type: "loading" });
    const url = buildUrl(path, values);
    const t0 = Date.now();
    try {
      const res = await fetch(url);
      const ms = Date.now() - t0;
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("image/")) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objUrl;
        setResponse({ type: "image", status: res.status, ms, url: objUrl, contentType: ct });
      } else if (ct.includes("audio/")) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objUrl;
        setResponse({ type: "audio", status: res.status, ms, url: objUrl });
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setResponse({ type: "json", status: res.status, ms, data: json });
        } catch {
          setResponse({ type: "json", status: res.status, ms, data: { raw: text } });
        }
      }
    } catch (err) {
      const ms = Date.now() - t0;
      setResponse({ type: "error", status: 0, ms, message: String(err) });
    }
  };

  const statusColor = (s: number) => {
    if (s >= 200 && s < 300) return "text-green-400";
    if (s >= 400 && s < 500) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-background overflow-hidden">
      <div className="bg-muted/30 px-4 py-3 border-b border-primary/10 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Live Tester</span>
      </div>

      <div className="p-4 space-y-4">
        {params.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {params.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                  {p.name}
                  {p.required ? (
                    <span className="text-red-400 text-xs">*</span>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs italic">optional</span>
                  )}
                </label>
                <Input
                  value={values[p.name] ?? ""}
                  onChange={(e) => setValue(p.name, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={p.required ? "required" : "optional"}
                  className="h-8 text-sm font-mono bg-card border-border/50 focus:border-primary/50"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No parameters required for this endpoint.</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={response.type === "loading"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs gap-1.5"
          >
            {response.type === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {response.type === "loading" ? "Sending..." : "Send Request"}
          </Button>
        </div>

        {response.type !== "idle" && response.type !== "loading" && (
          <div className="rounded-lg border border-border/40 bg-black/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-muted/10">
              {response.type === "error" ? (
                <XCircle className="h-3.5 w-3.5 text-red-400" />
              ) : response.type === "image" ? (
                <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
              ) : response.type === "audio" ? (
                <Volume2 className="h-3.5 w-3.5 text-purple-400" />
              ) : (
                <Terminal className="h-3.5 w-3.5 text-green-400" />
              )}
              <span className={"text-xs font-mono font-bold " + statusColor(response.status)}>
                {response.status > 0 ? response.status : "ERR"}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" /> {response.ms}ms
              </span>
            </div>

            <div className="p-4">
              {response.type === "json" && <JsonRenderer data={response.data} />}
              {response.type === "image" && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={response.url}
                    alt="API response"
                    className="max-h-72 max-w-full rounded-lg object-contain border border-border/20"
                  />
                  <span className="text-xs text-muted-foreground">{response.contentType}</span>
                </div>
              )}
              {response.type === "audio" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">Audio response:</p>
                  <audio controls src={response.url} className="w-full h-10" />
                </div>
              )}
              {response.type === "error" && (
                <p className="text-xs font-mono text-red-400">{response.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "AI Suite": Brain,
  "AI Imaging": Wand2,
  "Anime Hub": Layers,
  "Media Fetch": Download,
  "GameZone": Gamepad2,
  "Image Studio": ImageIcon,
  "CinemaDB": Film,
  "Search Engine": Search,
  "Discovery": Zap,
  "Audio Vault": Volume2,
  "Live Sports": Globe,
  "Web Capture": Globe,
  "Profile Lookup": UserPlus,
  "Text FX": AlignLeft,
  "Dev Tools": Terminal,
  "Link Shrink": Link2,
  "Font Forge": AlignLeft,
  "Voice Synth": Mic,
  "SMS Inbox": Phone,
};

function DocsIntro({ totalEndpoints, totalCategories, isLoading }: {
  totalEndpoints?: number;
  totalCategories?: number;
  isLoading: boolean;
}) {
  const [copiedBase, setCopiedBase] = useState(false);
  const { toast } = useToast();

  const handleCopyBase = () => {
    navigator.clipboard.writeText(BASE_URL + "/api");
    setCopiedBase(true);
    toast({ title: "Copied!", description: "Base URL copied to clipboard.", duration: 2000 });
    setTimeout(() => setCopiedBase(false), 2000);
  };

  return (
    <div className="mb-10 space-y-8">
      {/* Title + intro */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
          Trustbit API gives you instant access to{" "}
          {isLoading ? (
            <span className="inline-block w-8 h-4 bg-muted rounded animate-pulse align-middle" />
          ) : (
            <span className="text-primary font-semibold">{totalEndpoints ?? "545+"}  endpoints</span>
          )}{" "}
          across{" "}
          <span className="text-primary font-semibold">{totalCategories ?? 19} categories</span>
          {" "}— covering AI chat, image generation, anime, media downloading, voice synthesis, sports scores, profile lookups, and more. All requests go through one unified base URL.
        </p>
      </div>

      {/* Base URL */}
      <div className="rounded-xl border border-primary/20 bg-card/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Base URL</h2>
        </div>
        <div className="flex items-center gap-3 bg-background border border-border/50 rounded-lg p-3">
          <code className="flex-1 font-mono text-sm text-primary break-all select-all">
            {BASE_URL}/api
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 hover:bg-primary/10 hover:text-primary"
            onClick={handleCopyBase}
            title="Copy base URL"
          >
            {copiedBase ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Append any endpoint path to this base URL. Example:{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono">{BASE_URL}/api/ai/aichat?prompt=hello</code>
        </p>
      </div>

      {/* Quick start example */}
      <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-muted/20">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Quick Start — Fetch in 3 lines</span>
        </div>
        <div className="p-5">
          <pre className="font-mono text-xs md:text-sm leading-6 overflow-x-auto text-foreground">
            <span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-green-400">`{BASE_URL}/api/ai/aichat?prompt=hello`</span>);{"\n"}
            <span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> res.<span className="text-blue-400">json</span>();{"\n"}
            <span className="text-blue-400">console</span>.<span className="text-blue-400">log</span>(data); <span className="text-zinc-500">// {"{ status: true, creator: 'trustbit', ... }"}</span>
          </pre>
        </div>
      </div>

      {/* Response format */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Response Format</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          All JSON responses from Trustbit API share a consistent envelope. Media endpoints (images, audio) return binary data with the appropriate <code className="bg-muted px-1 rounded font-mono text-xs">Content-Type</code> header.
        </p>
        <pre className="font-mono text-xs leading-6 bg-black/40 rounded-lg p-4 overflow-x-auto text-green-400/90">
{`{
  "status": true,        // true on success, false on error
  "creator": "trustbit", // always rewritten to trustbit
  "result": { ... }     // the actual data — varies per endpoint
}`}
        </pre>
      </div>

      {/* Auth & Billing roadmap */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-yellow-400" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-yellow-400">Authentication — Coming Soon</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Currently all endpoints are open — no API key required. We are rolling out a full authentication and billing system in three phases:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: UserPlus,
              phase: "Phase 1",
              title: "Accounts",
              desc: "Register an account and log in to access your personal dashboard with usage stats.",
            },
            {
              icon: KeyRound,
              phase: "Phase 2",
              title: "API Keys",
              desc: "Each account gets a unique key. Pass it as a header or query param to authenticate requests.",
              example: "Authorization: Bearer <your-key>",
            },
            {
              icon: CreditCard,
              phase: "Phase 3",
              title: "Billing Plans",
              desc: "Free tier stays free. Pro and Enterprise plans unlock higher rate limits and priority routing.",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-card/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <item.icon size={14} />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{item.phase}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              {item.example && (
                <code className="block mt-2 text-xs font-mono bg-black/40 px-2 py-1.5 rounded text-primary/80 break-all">
                  {item.example}
                </code>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Docs() {
  const { data: endpointsData, isLoading: isLoadingEndpoints } = useListEndpoints();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();
  const { data: statusData, isLoading: isLoadingStatus } = useGetApiStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("overview");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [openTryIt, setOpenTryIt] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (path: string) => {
    const fullUrl = buildUrl(path, {});
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    toast({ title: "Copied to clipboard", description: "API endpoint URL copied.", duration: 2000 });
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    if (!endpointsData?.categories) return [];
    return endpointsData.categories
      .map((category) => {
        const filteredItems = category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.path.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...category, items: filteredItems };
      })
      .filter((category) => category.items.length > 0);
  }, [endpointsData, searchQuery]);

  const displayCategories = useMemo(() => {
    if (activeCategory === "all" || activeCategory === "overview") return filteredCategories;
    return filteredCategories.filter((cat) => cat.name === activeCategory);
  }, [filteredCategories, activeCategory]);

  const sidebarBtnClass = (active: boolean) =>
    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors " +
    (active
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground");

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-border/40 bg-card/30 md:block hidden h-[calc(100vh-4rem)] sticky top-16">
        <ScrollArea className="h-full py-6 pr-4 pl-4 md:pl-8">
          <div className="mb-6 px-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Getting Started</h3>
            <div className="space-y-1 mb-5">
              <button
                onClick={() => { setActiveCategory("overview"); setSearchQuery(""); }}
                className={sidebarBtnClass(activeCategory === "overview")}
              >
                <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Overview</span>
              </button>
            </div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Endpoints</h3>
            <div className="space-y-1">
              <button
                data-testid="btn-category-all"
                onClick={() => { setActiveCategory("all"); }}
                className={sidebarBtnClass(activeCategory === "all")}
              >
                <span>All Endpoints</span>
                {endpointsData && (
                  <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">
                    {endpointsData.totalEndpoints}
                  </span>
                )}
              </button>
              {isLoadingCategories
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md mt-1" />
                  ))
                : categoriesData?.categories?.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.name] ?? Terminal;
                    return (
                      <button
                        key={cat.name}
                        data-testid={"btn-category-" + cat.slug}
                        onClick={() => setActiveCategory(cat.name)}
                        className={sidebarBtnClass(activeCategory === cat.name)}
                      >
                        <span className="flex items-center gap-2 truncate pr-2">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {cat.name}
                        </span>
                        <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full shrink-0">
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-4xl">
          {/* Overview / Intro */}
          {activeCategory === "overview" && !searchQuery && (
            <DocsIntro
              totalEndpoints={statusData?.totalEndpoints}
              totalCategories={categoriesData?.total}
              isLoading={isLoadingStatus || isLoadingCategories}
            />
          )}

          {/* Category grid on overview */}
          {activeCategory === "overview" && !searchQuery && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-5">Browse by Category</h2>
              {isLoadingCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoriesData?.categories?.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.name] ?? Terminal;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        className="text-left rounded-xl border border-border/40 bg-card/30 p-4 hover:border-primary/40 hover:bg-card transition-all group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                          <Icon size={16} />
                        </div>
                        <p className="font-semibold text-sm leading-tight">{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{cat.count} endpoints</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search bar — shown when not on pure overview */}
          {(activeCategory !== "overview" || searchQuery) && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {activeCategory !== "overview" && activeCategory !== "all" && (
                  <button
                    onClick={() => { setActiveCategory("overview"); setSearchQuery(""); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    ← Overview
                  </button>
                )}
                <h1 className="text-2xl font-bold tracking-tight">
                  {activeCategory === "all" ? "All Endpoints" : activeCategory === "overview" ? "Search Results" : activeCategory}
                </h1>
                {endpointsData && activeCategory === "all" && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {endpointsData.totalEndpoints}
                  </Badge>
                )}
              </div>

              {activeCategory !== "overview" && (
                <p className="text-sm text-muted-foreground mb-4">
                  Base URL:{" "}
                  <code className="ml-1 px-2 py-0.5 bg-muted rounded text-primary font-mono text-xs border border-primary/20">
                    {BASE_URL}/api
                  </code>
                </p>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  data-testid="input-search-endpoints"
                  placeholder="Search endpoints by name, description, or path..."
                  className="w-full pl-10 h-12 bg-card border-border/50 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Mobile Category Pills */}
              <div className="mt-4 md:hidden flex overflow-x-auto pb-2 gap-2 snap-x">
                <Button
                  variant={activeCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                  className="shrink-0 snap-start"
                >
                  All
                </Button>
                {categoriesData?.categories?.map((cat) => (
                  <Button
                    key={cat.name}
                    variant={activeCategory === cat.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat.name)}
                    className="shrink-0 snap-start"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar on overview when typing */}
          {activeCategory === "overview" && (
            <div className={searchQuery ? "mb-6" : "mb-4"}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search all endpoints..."
                  className="w-full pl-10 h-11 bg-card border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Endpoint Cards */}
          {(activeCategory !== "overview" || searchQuery) && (
            <div className="space-y-10">
              {isLoadingEndpoints ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ))
              ) : displayCategories.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                  <Terminal className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No endpoints found</h3>
                  <p className="text-muted-foreground">We couldn&apos;t find any endpoints matching your search.</p>
                </div>
              ) : (
                displayCategories.map((category) => (
                  <div key={category.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/30 sticky top-16 bg-background/95 backdrop-blur z-10 pt-4">
                      <h2 className="text-2xl font-bold capitalize tracking-tight text-foreground/90">
                        {category.name}
                      </h2>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {category.items.length}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {category.items.map((endpoint, i) => {
                        const fullPath = endpoint.path.startsWith("/api")
                          ? endpoint.path
                          : "/api" + endpoint.path;
                        const tryItKey = category.name + ":" + i;
                        const isOpen = openTryIt === tryItKey;

                        return (
                          <div
                            key={tryItKey}
                            data-testid={"card-endpoint-" + i}
                            className={
                              "rounded-xl border bg-card/40 p-5 transition-all duration-300 " +
                              (isOpen
                                ? "border-primary/40 bg-card shadow-lg shadow-primary/5"
                                : "border-border/40 hover:bg-card hover:border-primary/30")
                            }
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold mb-2">{endpoint.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                                  {endpoint.desc}
                                </p>
                                <div className="flex items-center bg-background border border-border/50 rounded-lg p-1 max-w-full overflow-hidden">
                                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 mr-2 rounded-md font-mono shrink-0">
                                    GET
                                  </Badge>
                                  <code className="flex-1 text-sm font-mono text-muted-foreground truncate overflow-hidden text-ellipsis px-1 select-all">
                                    {fullPath}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={"button-copy-" + i}
                                    className="shrink-0 h-8 w-8 ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => handleCopy(fullPath)}
                                    title="Copy URL"
                                  >
                                    {copiedPath === fullPath ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="shrink-0 flex sm:flex-col gap-2">
                                <Button
                                  variant={isOpen ? "default" : "outline"}
                                  size="sm"
                                  data-testid={"button-try-" + i}
                                  className={
                                    "font-mono text-xs gap-1.5 transition-all " +
                                    (isOpen
                                      ? "bg-primary text-primary-foreground"
                                      : "border-primary/20 hover:bg-primary hover:text-primary-foreground")
                                  }
                                  onClick={() => setOpenTryIt(isOpen ? null : tryItKey)}
                                >
                                  <Zap className="h-3 w-3" />
                                  Try It
                                  {isOpen ? (
                                    <ChevronUp className="h-3 w-3 ml-0.5" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 ml-0.5" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {isOpen && <TryItPanel path={endpoint.path} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Search results on overview */}
          {activeCategory === "overview" && searchQuery && (
            <div className="space-y-10">
              {displayCategories.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                  <Terminal className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No endpoints found</h3>
                  <p className="text-muted-foreground">Nothing matched your search.</p>
                </div>
              ) : (
                displayCategories.map((category) => (
                  <div key={category.name} className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/30">
                      <h2 className="text-lg font-bold">{category.name}</h2>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {category.items.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {category.items.map((endpoint, i) => {
                        const fullPath = endpoint.path.startsWith("/api") ? endpoint.path : "/api" + endpoint.path;
                        const tryItKey = "search:" + category.name + ":" + i;
                        const isOpen = openTryIt === tryItKey;
                        return (
                          <div
                            key={tryItKey}
                            className={"rounded-xl border bg-card/40 p-5 transition-all duration-300 " + (isOpen ? "border-primary/40 bg-card shadow-lg shadow-primary/5" : "border-border/40 hover:bg-card hover:border-primary/30")}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold mb-1">{endpoint.name}</h3>
                                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{endpoint.desc}</p>
                                <div className="flex items-center bg-background border border-border/50 rounded-lg p-1 max-w-full overflow-hidden">
                                  <Badge className="bg-green-500/10 text-green-500 mr-2 rounded-md font-mono shrink-0">GET</Badge>
                                  <code className="flex-1 text-xs font-mono text-muted-foreground truncate px-1 select-all">{fullPath}</code>
                                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleCopy(fullPath)} title="Copy URL">
                                    {copiedPath === fullPath ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <Button variant={isOpen ? "default" : "outline"} size="sm" className={"font-mono text-xs gap-1.5 shrink-0 " + (isOpen ? "bg-primary text-primary-foreground" : "border-primary/20 hover:bg-primary hover:text-primary-foreground")} onClick={() => setOpenTryIt(isOpen ? null : tryItKey)}>
                                <Zap className="h-3 w-3" /> Try It {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </div>
                            {isOpen && <TryItPanel path={endpoint.path} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
