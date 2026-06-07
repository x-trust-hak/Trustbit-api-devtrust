import { Mail, Send, ExternalLink } from "lucide-react";

const SOCIALS = [
  {
    label: "Telegram",
    href: "https://t.me/KallmeTrust",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    label: "Channel",
    href: "https://t.me/TrustBitOfficial",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:trustsolos@gmail.com",
    icon: <Mail className="h-5 w-5" />,
  },
];

const TECH_STACK = [
  "Node.js", "Express.js", "TypeScript", "React", "Vite",
  "REST APIs", "Telegram Bots", "JavaScript", "PostgreSQL", "Git",
];

const CONTACT_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary shrink-0">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    label: "t.me/KallmeTrust",
    href: "https://t.me/KallmeTrust",
  },
  {
    icon: <Mail className="h-5 w-5 text-primary shrink-0" />,
    label: "trustsolos@gmail.com",
    href: "mailto:trustsolos@gmail.com",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary shrink-0">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    label: "t.me/TrustBitOfficial",
    href: "https://t.me/TrustBitOfficial",
  },
];

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 flex flex-col items-center text-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />

        {/* Avatar */}
        <div className="relative z-10 mb-6">
          <div className="relative inline-block">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-blue-400 to-primary opacity-80 blur-sm animate-pulse" />
            <div className="relative h-36 w-36 rounded-full border-4 border-primary overflow-hidden shadow-2xl shadow-primary/20">
              <img
                src="/avatar.jpg"
                alt="KallmeTrust"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Name & Role */}
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              KallmeTrust
            </span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-4">
            API Developer · Bot Builder · Website & App Developer
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm md:text-base">
            I build powerful APIs, bots, websites, and apps that make developers' lives easier.
            Creator of <span className="text-primary font-semibold">TrustbitAPI</span> — a unified platform
            with 545+ endpoints for AI, media, downloaders, and more.
          </p>

          {/* Social icons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 border-t border-border/30 px-4">
        <div className="max-w-lg mx-auto space-y-3">
          {CONTACT_ITEMS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card/80 transition-all duration-200 group"
            >
              {c.icon}
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {c.label}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-10 border-t border-border/30 px-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-lg font-bold mb-6 flex items-center justify-center gap-2">
            <span>🛠️</span> Tech Stack
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-10 border-t border-border/30 px-4 pb-20">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
            Innovative Projects
          </h2>

          {/* TrustbitAPI — live */}
          <div className="rounded-xl border border-primary/30 bg-card/50 p-5 mb-4 hover:border-primary/60 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-lg">TrustbitAPI</h3>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 font-medium">Live</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              A unified REST API platform with 545+ endpoints across AI, downloaders,
              anime, tools, TTS, and more. Free to use with no API key required.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Node.js", "Express", "TypeScript", "React"].map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">{t}</span>
              ))}
            </div>
          </div>

          {/* TrustbitAPI Telegram Bot — live */}
          <div className="rounded-xl border border-blue-500/20 bg-card/50 p-5 mb-4 hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-lg">TrustbitAPI Bot</h3>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">Live</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              A Telegram bot that lets users call 545+ Trustbit API endpoints directly in chat —
              AI, TTS, image generation, TikTok download, and more.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Telegram Bot API", "Node.js", "Webhooks"].map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">{t}</span>
              ))}
            </div>
          </div>

          {/* Coming soon slots */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-dashed border-border/30 bg-card/20 p-5 mb-4 flex flex-col items-center justify-center text-center min-h-[100px]"
            >
              <p className="text-muted-foreground/50 text-sm font-medium">🚀 Coming Soon</p>
              <p className="text-muted-foreground/30 text-xs mt-1">New project dropping</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-border/20 py-6 text-center px-4">
        <p className="text-xs text-muted-foreground">
          Built with ❤️ by{" "}
          <a href="https://t.me/KallmeTrust" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            KallmeTrust
          </a>
          {" · "}
          <a href="https://t.me/TrustBitOfficial" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            @TrustBitOfficial
          </a>
        </p>
      </div>
    </div>
  );
}
