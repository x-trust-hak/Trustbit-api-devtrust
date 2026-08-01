import { useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { useListEndpoints, useListCategories } from "@workspace/api-client-react";
import {
  Search, Copy, Check, Terminal, Zap, Send, ChevronDown, ChevronUp,
  Image as ImageIcon, Volume2, Loader2, XCircle, Clock, KeyRound, LogIn,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("tb_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey ?? null;
  } catch {
    return null;
  }
}

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

interface Param { name: string; required: boolean }

function parseParams(path: string): Param[] {
  const qIdx = path.indexOf("?");
  if (qIdx === -1) return [];
  return path.slice(qIdx + 1).split("&").map((part) => {
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
  return (
    <pre className="text-xs font-mono leading-5 overflow-auto max-h-80 text-green-400/90 whitespace-pre-wrap break-all">
      {text.split("\n").map((line, i) => (
        <span key={i} className="block hover:bg-white/5 px-1 rounded">{line}</span>
      ))}
    </pre>
  );
}

function QuickStartSection({ examples, baseUrl }: {
  examples: { lang: string; code: string }[];
  baseUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(examples[activeLang]?.code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-card/30 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">How to use the API</p>
            <p className="text-xs text-muted-foreground">Quick start with code examples and a sample key</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-primary/10 p-4 space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">1</div>
            <div>
              <p className="text-sm font-semibold mb-0.5">Get your API key</p>
              <p className="text-xs text-muted-foreground mb-2">
                Create a free account to get your personal key — it starts with <code className="font-mono text-primary">tb_</code>
              </p>
              <div className="flex gap-2">
                <Link href="/register">
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    <Terminal className="h-3 w-3" /> Create free account
                  </button>
                </Link>
                <Link href="/login">
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                    <LogIn className="h-3 w-3" /> Sign in
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">2</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-0.5">Pass your key with every request</p>
              <p className="text-xs text-muted-foreground mb-3">
                Use the <code className="font-mono text-primary">x-api-key</code> header <span className="text-muted-foreground/60">(recommended)</span> or the <code className="font-mono text-primary">apikey</code> query parameter.
                Replace the sample key below with your real one.
              </p>

              {/* Language tabs */}
              <div className="flex gap-1 mb-0 flex-wrap">
                {examples.map((ex, i) => (
                  <button
                    key={ex.lang}
                    onClick={() => setActiveLang(i)}
                    className={"text-xs px-2.5 py-1 rounded-t-md border border-b-0 transition-colors font-mono " +
                      (activeLang === i
                        ? "bg-zinc-900 border-border/50 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground")}
                  >
                    {ex.lang}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div className="relative rounded-b-lg rounded-tr-lg bg-zinc-900 border border-border/50 overflow-hidden">
                <button
                  onClick={copy}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border/40 bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <pre className="p-4 pr-16 text-xs font-mono leading-relaxed text-green-400/90 overflow-x-auto whitespace-pre">
                  {examples[activeLang]?.code}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">3</div>
            <div>
              <p className="text-sm font-semibold mb-0.5">Browse &amp; test endpoints below</p>
              <p className="text-xs text-muted-foreground">
                Every endpoint has a <span className="text-primary font-medium">Try It</span> button — hit it while signed in to test live with your key. Use the search bar and category filters to find what you need.
              </p>
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/15 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="text-yellow-400 font-semibold">💡 Tip: </span>
            The sample key above (<code className="font-mono text-primary/80">tb_a1b2c3...</code>) is just for illustration — it won't work. Sign up to get a real key with 100 free credits.
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _baseUrlRef = typeof window !== "undefined" ? window.location.origin : "";

function TryItPanel({ path }: { path: string }) {
  const params = useMemo(() => parseParams(path), [path]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, ""]))
  );
  const [response, setResponse] = useState<ResponseState>({ type: "idle" });
  const objectUrlRef = useRef<string | null>(null);

  const setValue = (name: string, val: string) => setValues((prev) => ({ ...prev, [name]: val }));

  const handleSend = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setResponse({ type: "error", status: 0, ms: 0, message: "SIGN_IN_REQUIRED" });
      return;
    }
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setResponse({ type: "loading" });
    const url = buildUrl(path, values);
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: { "x-api-key": apiKey } });
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
        try { setResponse({ type: "json", status: res.status, ms, data: JSON.parse(text) }); }
        catch { setResponse({ type: "json", status: res.status, ms, data: { raw: text } }); }
      }
    } catch (err) {
      setResponse({ type: "error", status: 0, ms: Date.now() - t0, message: String(err) });
    }
  };

  const statusColor = (s: number) => s >= 200 && s < 300 ? "text-green-400" : s >= 400 && s < 500 ? "text-yellow-400" : "text-red-400";

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
                  {p.required ? <span className="text-red-400 text-xs">*</span> : <span className="text-muted-foreground/50 text-xs italic">optional</span>}
                </label>
                <Input value={values[p.name] ?? ""} onChange={(e) => setValue(p.name, e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={p.required ? "required" : "optional"} className="h-8 text-sm font-mono bg-card border-border/50 focus:border-primary/50" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No parameters required for this endpoint.</p>
        )}
        <Button size="sm" onClick={handleSend} disabled={response.type === "loading"} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs gap-1.5">
          {response.type === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {response.type === "loading" ? "Sending..." : "Send Request"}
        </Button>
        {response.type === "error" && response.message === "SIGN_IN_REQUIRED" && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col items-center text-center gap-3">
            <KeyRound className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold">Sign in required to test endpoints</p>
              <p className="text-xs text-muted-foreground mt-1">Create a free account to get your API key and 100 free credits.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/register"><Button size="sm" className="font-mono text-xs gap-1.5"><Terminal className="h-3.5 w-3.5" /> Create free account</Button></Link>
              <Link href="/login"><Button size="sm" variant="outline" className="font-mono text-xs gap-1.5"><LogIn className="h-3.5 w-3.5" /> Sign in</Button></Link>
            </div>
          </div>
        )}
        {response.type !== "idle" && response.type !== "loading" && !(response.type === "error" && response.message === "SIGN_IN_REQUIRED") && (
          <div className="rounded-lg border border-border/40 bg-black/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-muted/10">
              {response.type === "error" ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : response.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-blue-400" /> : response.type === "audio" ? <Volume2 className="h-3.5 w-3.5 text-purple-400" /> : <Terminal className="h-3.5 w-3.5 text-green-400" />}
              <span className={"text-xs font-mono font-bold " + statusColor(response.status)}>{response.status > 0 ? response.status : "ERR"}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"><Clock className="h-3 w-3" /> {response.ms}ms</span>
            </div>
            <div className="p-4">
              {response.type === "json" && <JsonRenderer data={response.data} />}
              {response.type === "image" && <div className="flex flex-col items-center gap-2"><img src={response.url} alt="API response" className="max-h-72 max-w-full rounded-lg object-contain border border-border/20" /><span className="text-xs text-muted-foreground">{response.contentType}</span></div>}
              {response.type === "audio" && <div className="space-y-2"><p className="text-xs text-muted-foreground mb-2">Audio response:</p><audio controls src={response.url} className="w-full h-10" /></div>}
              {response.type === "error" && <p className="text-xs font-mono text-red-400">{response.message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Docs() {
  const { data: endpointsData, isLoading: isLoadingEndpoints } = useListEndpoints();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [openTryIt, setOpenTryIt] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(buildUrl(path, {}));
    setCopiedPath(path);
    toast({ title: "Copied to clipboard", description: "API endpoint URL copied.", duration: 2000 });
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    if (!endpointsData?.categories) return [];
    return endpointsData.categories.map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.path.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter((c) => c.items.length > 0);
  }, [endpointsData, searchQuery]);

  const displayCategories = useMemo(() => {
    if (activeCategory === "all") return filteredCategories;
    return filteredCategories.filter((c) => c.name === activeCategory);
  }, [filteredCategories, activeCategory]);

  const sidebarBtnClass = (active: boolean) =>
    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors " +
    (active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground");

  const FAKE_KEY = "tb_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

  const quickStartExamples = [
    {
      lang: "JavaScript",
      code: `const apiKey = "${FAKE_KEY}";

const res = await fetch(
  \`${BASE_URL}/api/ai/aichat?prompt=Hello\`,
  { headers: { "x-api-key": apiKey } }
);

const data = await res.json();
console.log(data);`,
    },
    {
      lang: "Python",
      code: `import requests

API_KEY = "${FAKE_KEY}"

res = requests.get(
    "${BASE_URL}/api/ai/aichat",
    params={"prompt": "Hello"},
    headers={"x-api-key": API_KEY}
)

print(res.json())`,
    },
    {
      lang: "cURL",
      code: `curl "${BASE_URL}/api/ai/aichat?prompt=Hello" \\
  -H "x-api-key: ${FAKE_KEY}"`,
    },
    {
      lang: "Query Param",
      code: `# You can also pass your key as a query parameter:

${BASE_URL}/api/ai/aichat?prompt=Hello&apikey=${FAKE_KEY}`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
      <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-border/40 bg-card/30 md:block hidden h-[calc(100vh-4rem)] sticky top-16">
        <ScrollArea className="h-full py-6 pr-4 pl-4 md:pl-8">
          <div className="mb-6 px-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
            <div className="space-y-1">
              <button data-testid="btn-category-all" onClick={() => setActiveCategory("all")} className={sidebarBtnClass(activeCategory === "all")}>
                <span>All Endpoints</span>
                {endpointsData && <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{endpointsData.totalEndpoints}</span>}
              </button>
              {isLoadingCategories
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md mt-1" />)
                : categoriesData?.categories?.map((cat) => (
                    <button key={cat.name} data-testid={"btn-category-" + cat.slug} onClick={() => setActiveCategory(cat.name)} className={sidebarBtnClass(activeCategory === cat.name)}>
                      <span className="truncate pr-2">{cat.name}</span>
                      <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full shrink-0">{cat.count}</span>
                    </button>
                  ))}
            </div>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">API Reference</h1>
            <p className="text-muted-foreground text-sm mb-5">
              Base URL:{" "}
              <code className="ml-1 px-2 py-0.5 bg-muted rounded text-primary font-mono border border-primary/20">{BASE_URL}/api</code>
            </p>

            {/* ── Getting Started ── */}
            <QuickStartSection examples={quickStartExamples} baseUrl={BASE_URL} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" data-testid="input-search-endpoints" placeholder="Search endpoints by name, description, or path..." className="w-full pl-10 h-12 bg-card border-border/50 text-base" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="mt-4 md:hidden flex overflow-x-auto pb-2 gap-2 snap-x">
              <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("all")} className="shrink-0 snap-start">All</Button>
              {categoriesData?.categories?.map((cat) => (
                <Button key={cat.name} variant={activeCategory === cat.name ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(cat.name)} className="shrink-0 snap-start">{cat.name}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {isLoadingEndpoints ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
              ))
            ) : displayCategories.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                <Terminal className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No endpoints found</h3>
                <p className="text-muted-foreground">No endpoints matched your search.</p>
              </div>
            ) : (
              displayCategories.map((category) => (
                <div key={category.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/30 sticky top-16 bg-background/95 backdrop-blur z-10 pt-4">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground/90">{category.name}</h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{category.items.length}</Badge>
                  </div>
                  <div className="space-y-4">
                    {category.items.map((endpoint, i) => {
                      const fullPath = endpoint.path.startsWith("/api") ? endpoint.path : "/api" + endpoint.path;
                      const tryItKey = category.name + ":" + i;
                      const isOpen = openTryIt === tryItKey;
                      return (
                        <div key={tryItKey} data-testid={"card-endpoint-" + i} className={"rounded-xl border bg-card/40 p-5 transition-all duration-300 " + (isOpen ? "border-primary/40 bg-card shadow-lg shadow-primary/5" : "border-border/40 hover:bg-card hover:border-primary/30")}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-2">{endpoint.name}</h3>
                              <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">{endpoint.desc}</p>
                              <div className="flex items-center bg-background border border-border/50 rounded-lg p-1 max-w-full overflow-hidden">
                                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 mr-2 rounded-md font-mono shrink-0">GET</Badge>
                                <code className="flex-1 text-sm font-mono text-muted-foreground truncate px-1 select-all">{fullPath}</code>
                                <Button variant="ghost" size="icon" data-testid={"button-copy-" + i} className="shrink-0 h-8 w-8 ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleCopy(fullPath)} title="Copy URL">
                                  {copiedPath === fullPath ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <Button variant={isOpen ? "default" : "outline"} size="sm" data-testid={"button-try-" + i} className={"shrink-0 font-mono text-xs gap-1.5 transition-all " + (isOpen ? "bg-primary text-primary-foreground" : "border-primary/20 hover:bg-primary hover:text-primary-foreground")} onClick={() => setOpenTryIt(isOpen ? null : tryItKey)}>
                              <Zap className="h-3 w-3" />
                              Try It
                              {isOpen ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
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
        </div>
      </main>
    </div>
  );
}
