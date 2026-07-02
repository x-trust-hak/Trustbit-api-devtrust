import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json() as { token?: string; user?: { username: string }; error?: string };
      if (!res.ok) {
        toast({ title: "Registration failed", description: data.error ?? "Could not create account", variant: "destructive" });
        return;
      }
      localStorage.setItem("tb_token", data.token!);
      localStorage.setItem("tb_user", JSON.stringify(data.user));
      toast({ title: "Account created!", description: "Welcome to Trustbit API", duration: 2000 });
      navigate("/dashboard");
    } catch {
      toast({ title: "Network error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              <Terminal size={18} />
            </div>
            <span className="font-mono font-bold text-xl">Trustbit<span className="text-primary">API</span></span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm">Get your API key — free, instant, no card needed</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <Input placeholder="devname" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 bg-card border-border/50" autoComplete="username" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-card border-border/50" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-card border-border/50 pr-10" autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 font-mono" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground text-center">
          Free plan includes <span className="text-primary font-semibold">100 credits</span> — no payment required to start.
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
