import { Link } from "wouter";
import { Terminal, Mail } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/docs", label: "Documentation" },
  { href: "/status", label: "Status" },
  { href: "/portfolio", label: "Portfolio" },
];

const RESOURCE_LINKS = [
  { href: "/docs", label: "API Reference" },
  { href: "/status", label: "Platform Status" },
  { href: "https://t.me/TrustBitOfficial", label: "Telegram Channel", external: true },
];

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background mt-auto">
      {/* Main footer body */}
      <div className="container mx-auto px-4 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Terminal size={16} />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight">
              Trustbit<span className="text-primary">API</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            A unified API platform with 545+ endpoints across AI, anime,
            downloaders, TTS, tools, and more. Free. Fast. No key required.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://t.me/KallmeTrust"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              title="Telegram"
            >
              <TelegramIcon />
            </a>
            <a
              href="https://t.me/TrustBitOfficial"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              title="Channel"
            >
              <TelegramIcon />
            </a>
            <a
              href="mailto:trustsolos@gmail.com"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              title="Email"
            >
              <Mail size={14} />
            </a>
          </div>
        </div>

        {/* Pages */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pages</h3>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resources</h3>
          <ul className="space-y-2.5">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {year} TrustbitAPI. All rights reserved.</span>
          <span>
            Built with ❤️ by{" "}
            <a
              href="https://t.me/KallmeTrust"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              KallmeTrust
            </a>
            {" · "}
            <a
              href="https://t.me/TrustBitOfficial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              @TrustBitOfficial
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
