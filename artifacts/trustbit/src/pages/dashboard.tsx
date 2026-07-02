import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, Copy, Check, CreditCard, Zap, User, LogOut, RefreshCw, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  username: string;
  email: string;
  apiKey: string;
  plan: string;
  credits: number;
  totalRequests: number;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  plan: string;
  amount: number;
  status: "pending" | "approved" | "declined";
  adminNote?: string;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = { free: "Free", biweekly: "2-Week", monthly: "Monthly", lifetime: "Lifetime" };
const PLAN_COLORS: Record<string, string> = {
  free: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  biweekly: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  monthly: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  lifetime: "bg-primary/10 text-primary border-primary/20",
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("tb_token") : null;

  const fetchUser = useCallback(async () => {
    if (!token) { navigate("/login"); return; }
    try {
      const [userRes, payRes] = await Promise.all([
        fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }),
        fetch("/api/payment/my", { headers: { Authorization: "Bearer " + token } }),
      ]);
      if (userRes.status === 401) { localStorage.removeItem("tb_token"); navigate("/login"); return; }
      if (userRes.ok) setUser(await userRes.json() as UserData);
      if (payRes.ok) {
        const d = await payRes.json() as { payments: PaymentRecord[] };
        setPayments(d.payments ?? []);
      }
    } catch {
      toast({ title: "Failed to load dashboard", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, navigate, toast]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const copyKey = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.apiKey);
    setCopiedKey(true);
    toast({ title: "API key copied!", duration: 2000 });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const logout = () => {
    localStorage.removeItem("tb_token");
    localStorage.removeItem("tb_user");
    navigate("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );

  if (!user) return null;

  const creditsDisplay = user.credits === -1 ? "∞" : user.credits.toLocaleString();
  const creditsLabel = user.credits === -1 ? "Unlimited" : user.credits + " credits remaining";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-mono font-bold text-lg">Trustbit<span className="text-primary">API</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Hey, {user.username} 👋</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchUser} title="Refresh">
            <RefreshCw size={16} />
          </Button>
        </div>

        {/* Plan + Credits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <User size={14} /> <span className="text-xs uppercase tracking-wider">Plan</span>
            </div>
            <Badge className={"text-sm px-3 py-1 " + (PLAN_COLORS[user.plan] ?? PLAN_COLORS["free"])}>
              {PLAN_LABELS[user.plan] ?? user.plan}
            </Badge>
            {user.plan === "free" && (
              <Link href="/upgrade">
                <p className="text-xs text-primary mt-3 flex items-center gap-1 hover:underline cursor-pointer">
                  Upgrade <ArrowUpRight size={10} />
                </p>
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Zap size={14} /> <span className="text-xs uppercase tracking-wider">Credits</span>
            </div>
            <p className="text-2xl font-mono font-bold text-primary">{creditsDisplay}</p>
            <p className="text-xs text-muted-foreground mt-1">{creditsLabel}</p>
          </div>
        </div>

        {/* API Key */}
        <div className="rounded-xl border border-primary/20 bg-card/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-primary" />
            <h2 className="font-semibold">Your API Key</h2>
          </div>
          <div className="flex items-center gap-2 bg-background border border-border/50 rounded-lg p-3">
            <code className="flex-1 font-mono text-sm text-primary break-all select-all">{user.apiKey}</code>
            <Button variant="ghost" size="icon" onClick={copyKey} className="shrink-0 h-8 w-8 hover:bg-primary/10 hover:text-primary">
              {copiedKey ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Pass your key with every request:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">?apikey={user.apiKey.slice(0, 10)}...</code>
            {" "}or as a header:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">x-api-key: {user.apiKey.slice(0, 10)}...</code>
          </p>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Zap size={15} className="text-primary" /> Usage</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Requests</p>
              <p className="text-xl font-mono font-bold">{user.totalRequests.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-card/40 p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard size={15} className="text-primary" /> Payment History</h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{p.plan} plan — ₦{p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {new Date(p.createdAt).toLocaleDateString()}
                      {p.adminNote && <span className="ml-2 italic">· {p.adminNote}</span>}
                    </p>
                  </div>
                  <Badge className={p.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" : p.status === "declined" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/docs" className="flex-1">
            <Button variant="outline" className="w-full gap-2"><Zap size={14} /> Browse API</Button>
          </Link>
          {user.plan !== "lifetime" && (
            <Link href="/upgrade" className="flex-1">
              <Button className="w-full gap-2"><CreditCard size={14} /> Upgrade Plan</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
