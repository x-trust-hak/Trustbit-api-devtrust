import { Link, useLocation, useLocation as useNav } from "wouter";
import { Terminal, Activity, BookOpen, Layers, Menu, X, User, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [, navigate] = useNav();
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flash, setFlash] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("tb_token"));
  }, [location]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCount.current += 1;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setMobileOpen(false);
      navigate("/admin");
      return;
    }
    clickTimer.current = setTimeout(() => {
      if (clickCount.current < 5) { clickCount.current = 0; navigate("/"); }
    }, 1500);
  };

  const navItems = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/docs", label: "Documentation", icon: BookOpen },
    { href: "/status", label: "Status", icon: Activity },
    { href: "/portfolio", label: "Portfolio", icon: User },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">

        {/* Logo */}
        <button onClick={handleLogoClick} className="flex items-center gap-2.5 transition-opacity hover:opacity-80 select-none group">
          <div className={"flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-all duration-150 " + (flash ? "bg-primary/60 scale-90" : "bg-primary text-primary-foreground shadow-md shadow-primary/30")}>
            <Terminal size={16} />
          </div>
          <span className="font-mono font-extrabold tracking-tight text-base">
            Trustbit<span className="text-primary">API</span>
          </span>
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={"flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all " + (isActive(item.href) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                <item.icon size={13} /> {item.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5">
                <LayoutDashboard size={12} />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button size="sm" variant="ghost" className="font-mono text-xs gap-1.5">
                  <LogIn size={12} />
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex">
                <Button size="sm" className="font-mono text-xs shadow-sm shadow-primary/20 gap-1.5">
                  <Terminal size={12} />
                  Get API Key
                </Button>
              </Link>
            </>
          )}
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={"md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-border/30 bg-background/95 backdrop-blur-xl " + (mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none")}>
        <nav className="container mx-auto px-4 py-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all " + (isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                <item.icon size={15} /> {item.label}
              </div>
            </Link>
          ))}
          <div className="pt-2 pb-1 space-y-2">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full font-mono text-sm gap-2">
                  <LayoutDashboard size={13} /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full font-mono text-sm gap-2">
                    <Terminal size={13} /> Get API Key
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full font-mono text-sm gap-2">
                    <LogIn size={13} /> Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
