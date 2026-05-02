import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Activity, Server, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  RefreshCw, Lock, Shield, Zap, Database, Eye, Radio,
} from "lucide-react";

const ADMIN_KEY = "trustbit-admin-2026";

function formatBytes(b: number): string {
  if (b === 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / Math.pow(1024, i)).toFixed(1) + " " + u[i];
}
function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}
function formatUptime(s: number): string {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + "d " + h + "h";
  if (h > 0) return h + "h " + m + "m";
  return m + "m " + (s % 60) + "s";
}
function statusBg(s: number): string {
  if (s >= 500) return "bg-red-500/10 text-red-400";
  if (s >= 400) return "bg-yellow-500/10 text-yellow-400";
  return "bg-green-500/10 text-green-400";
}

interface Stats {
  startedAt: number;
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  totalBytes: number;
  successRate: number;
  avgResponseMs: number;
  hourBuckets: { label: string; requests: number; errors: number; bytes: number }[];
  topEndpoints: { path: string; count: number; errors: number; avgMs: number }[];
  recentRequests: { id: number; method: string; path: string; status: number; ms: number; bytes: number; ts: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 flex items-start gap-3">
      <div className={"flex h-9 w-9 items-center justify-center rounded-lg shrink-0 " + (color ?? "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className="text-xl font-bold font-mono">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
      <Activity className="h-6 w-6 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const submit = () => {
    if (key === ADMIN_KEY) { onUnlock(); }
    else { setError(true); setTimeout(() => setError(false), 1500); }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-1">Trustbit API Control Panel</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Enter admin key..."
              className={"w-full rounded-lg border px-4 py-2.5 text-sm bg-background font-mono transition-colors outline-none " +
                (error ? "border-red-500 text-red-400" : "border-border/50 focus:border-primary/50")}
            />
            {error && <p className="text-xs text-red-400 mt-1.5">Invalid key. Try again.</p>}
          </div>
          <button
            onClick={submit}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" /> Unlock Dashboard
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Secret admin panel — do not share this URL</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("tb_admin") === ADMIN_KEY);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const unlock = () => {
    sessionStorage.setItem("tb_admin", ADMIN_KEY);
    setUnlocked(true);
  };

  const fetchStats = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?key=${ADMIN_KEY}`);
      if (res.ok) {
        setStats(await res.json());
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [unlocked]);

  useEffect(() => { if (unlocked) fetchStats(); }, [unlocked, fetchStats]);
  useEffect(() => {
    if (!autoRefresh || !unlocked) return;
    const t = setInterval(fetchStats, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, unlocked, fetchStats]);

  if (!unlocked) return <LockScreen onUnlock={unlock} />;

  const hasRequests = (stats?.totalRequests ?? 0) > 0;
  const hasHourData = stats?.hourBuckets.some((b) => b.requests > 0) ?? false;
  const hasEndpoints = (stats?.topEndpoints.length ?? 0) > 0;
  const hasBytes = (stats?.totalBytes ?? 0) > 0;

  const pieData = hasRequests && stats
    ? [
        { name: "Success", value: stats.totalRequests - stats.totalErrors },
        { name: "Errors", value: Math.max(stats.totalErrors, 0) },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-none truncate">Trustbit Admin</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Control Panel</p>
          </div>
          <div className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
            <Radio className="h-2 w-2 text-green-500 animate-pulse" />
            <span className="text-xs text-green-500 font-medium">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground hidden lg:block">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={"text-xs px-2.5 py-1.5 rounded-lg border transition-colors " +
              (autoRefresh ? "bg-primary/10 border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}
          >
            Auto {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={"h-3 w-3 " + (loading ? "animate-spin" : "")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {!stats ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Activity className="h-6 w-6 animate-pulse mr-2" /> Loading metrics...
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={TrendingUp} label="Total Requests" value={formatNum(stats.totalRequests)}
                sub={"since " + new Date(stats.startedAt).toLocaleDateString()} color="bg-primary/10 text-primary" />
              <StatCard icon={CheckCircle2} label="Success Rate" value={stats.successRate.toFixed(1) + "%"}
                sub={stats.totalErrors + " errors"}
                color={stats.successRate >= 95 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"} />
              <StatCard icon={Clock} label="Avg Response" value={stats.avgResponseMs > 0 ? stats.avgResponseMs + "ms" : "—"}
                sub="across all endpoints" color="bg-blue-500/10 text-blue-400" />
              <StatCard icon={Database} label="Data Served" value={formatBytes(stats.totalBytes)}
                sub={"uptime " + formatUptime(stats.uptime)} color="bg-purple-500/10 text-purple-400" />
            </div>

            {/* Charts row — only shown when there's real traffic */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Requests — Last 24 Hours</h2>
                </div>
                {hasHourData ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.hourBuckets} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ffcc" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} interval={3} />
                      <YAxis tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#aaa" }} />
                      <Area type="monotone" dataKey="requests" stroke="#00ffcc" strokeWidth={2} fill="url(#reqGrad)" name="Requests" />
                      <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1.5} fill="url(#errGrad)" name="Errors" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Waiting for traffic to appear here" />
                )}
              </div>

              <div className="rounded-xl border border-border/40 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Success vs Errors</h2>
                </div>
                {hasRequests && pieData[0]?.value > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        <Cell fill="#00ffcc" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#aaa", fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No requests recorded yet" />
                )}
              </div>
            </div>

            {/* Top Endpoints */}
            <div className="rounded-xl border border-border/40 bg-card/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Top Endpoints by Requests</h2>
              </div>
              {hasEndpoints ? (
                <ResponsiveContainer width="100%" height={Math.max(180, stats.topEndpoints.length * 32)}>
                  <BarChart data={stats.topEndpoints} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="path" width={160} tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, name: string) => [formatNum(v), name]} />
                    <Bar dataKey="count" fill="#00ffcc" opacity={0.8} radius={[0, 4, 4, 0]} name="Requests" />
                    <Bar dataKey="errors" fill="#ef4444" opacity={0.7} radius={[0, 4, 4, 0]} name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Hit some endpoints and refresh to see data" />
              )}
            </div>

            {/* Bytes over time — only when there's data */}
            {hasBytes && (
              <div className="rounded-xl border border-border/40 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Data Served — Last 24 Hours</h2>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={stats.hourBuckets} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="byteGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => formatBytes(v)} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [formatBytes(v), "Bytes"]} />
                    <Area type="monotone" dataKey="bytes" stroke="#7c3aed" strokeWidth={2} fill="url(#byteGrad)" name="Bytes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Live Request Log */}
            <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
              <div className="px-4 md:px-5 py-4 border-b border-border/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Live Request Log</h2>
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">
                  last {stats.recentRequests.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/20">
                      {["Time", "Method", "Path", "Status", "Duration", "Size"].map((h) => (
                        <th key={h} className="text-left px-3 md:px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {stats.recentRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Activity className="h-5 w-5 mx-auto mb-2 opacity-30" />
                          No requests yet — traffic will appear here in real time
                        </td>
                      </tr>
                    ) : (
                      stats.recentRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 md:px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(r.ts).toLocaleTimeString()}
                          </td>
                          <td className="px-3 md:px-4 py-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">{r.method}</span>
                          </td>
                          <td className="px-3 md:px-4 py-2 font-mono text-foreground/80 max-w-[180px] md:max-w-xs truncate">{r.path}</td>
                          <td className="px-3 md:px-4 py-2">
                            <span className={"px-1.5 py-0.5 rounded font-mono font-bold text-xs " + statusBg(r.status)}>
                              {r.status}
                            </span>
                          </td>
                          <td className={"px-3 md:px-4 py-2 font-mono " + (r.ms > 2000 ? "text-yellow-400" : "text-muted-foreground")}>
                            {r.ms}ms
                          </td>
                          <td className="px-3 md:px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{formatBytes(r.bytes)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response time leaderboard — only when there's data */}
            {hasEndpoints && (
              <div className="rounded-xl border border-border/40 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Avg Response Time by Endpoint</h2>
                </div>
                <div className="space-y-2">
                  {stats.topEndpoints.slice(0, 10).map((ep, i) => (
                    <div key={ep.path} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <span className="font-mono text-xs text-foreground/70 truncate flex-1 min-w-0">{ep.path}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-1.5 rounded-full bg-primary/20 w-16 md:w-24 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: Math.min(100, (ep.avgMs / 5000) * 100) + "%",
                              background: ep.avgMs > 3000 ? "#ef4444" : ep.avgMs > 1000 ? "#f59e0b" : "#00ffcc",
                            }}
                          />
                        </div>
                        <span className={"text-xs font-mono " + (ep.avgMs > 3000 ? "text-red-400" : ep.avgMs > 1000 ? "text-yellow-400" : "text-green-400")}>
                          {ep.avgMs}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
