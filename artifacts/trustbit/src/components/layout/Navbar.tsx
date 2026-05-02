import { Link, useLocation } from "wouter";
import { Terminal, Activity, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/docs", label: "Documentation", icon: BookOpen },
    { href: "/status", label: "Status", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            <Terminal size={18} />
          </div>
          <span className="font-mono font-bold tracking-tight text-lg">Trustbit<span className="text-primary">API</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                location === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/docs" className="hidden sm:inline-flex">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary font-mono text-xs">
              GET /api/start
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
