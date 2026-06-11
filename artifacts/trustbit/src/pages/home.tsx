import { Link } from "wouter";
import { ArrowRight, Terminal, Zap, Layers, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiStatus, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: statusData, isLoading: isLoadingStatus } = useGetApiStatus();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 md:mb-8">
              <Zap className="mr-2 h-3.5 w-3.5" />
              <span>v1.0.0 is now live</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-5 md:mb-6 text-balance">
              The secret weapon in every{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                developer's toolkit.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              Instant access to AI, anime, downloaders, tools, and more.
              One unified API. Zero friction. Built for speed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Link href="/docs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 font-mono text-sm group">
                  <Terminal className="mr-2 h-4 w-4" />
                  Explore Endpoints
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/status" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-border hover:bg-muted">
                  View Platform Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 md:py-12 border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                label: "Endpoints",
                value: isLoadingStatus ? null : (statusData?.totalEndpoints ?? "550+"),
              },
              {
                label: "Categories",
                value: isLoadingCategories ? null : (categoriesData?.total ?? "19+"),
              },
              { label: "Uptime", value: "99.9%" },
              { label: "Latency", value: "<50ms" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-mono font-bold text-primary mb-1">
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-20 mx-auto" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Snippet & Features */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Integrate in seconds.</h2>
            <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
              Stop managing dozens of API keys and inconsistent documentation.
              Trustbit unifies the most powerful tools behind a single, elegant interface.
            </p>
            <div className="space-y-5 md:space-y-6">
              {[
                { icon: Layers, title: "Unified Architecture", desc: "One structure to learn. Use it everywhere." },
                { icon: Shield, title: "Enterprise Grade", desc: "Built on edge infrastructure for minimal latency." },
                { icon: Code, title: "Developer First", desc: "Types, clear errors, and copy-paste examples." },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-base">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/50 to-blue-500/50 opacity-20 blur-xl transition duration-500 group-hover:opacity-40" />
            <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
              <div className="flex items-center px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto text-xs font-mono text-muted-foreground">example.js</div>
              </div>
              <div className="p-4 md:p-6 overflow-x-auto">
                <pre className="font-mono text-xs md:text-sm leading-loose whitespace-pre">
                  <code className="text-foreground">
                    <span className="text-purple-400">const</span>{" "}
                    <span className="text-blue-300">response</span>{" = "}
                    <span className="text-purple-400">await</span>{" "}
                    <span className="text-blue-400">fetch</span>{"("}
                    {"\n  "}
                    <span className="text-green-400">'https://trustbit.app/api/ai/aichat'</span>
                    {"\n  + "}
                    <span className="text-green-400">'?prompt=hello'</span>
                    {"\n);\n"}
                    <span className="text-purple-400">const</span>{" "}
                    <span className="text-blue-300">data</span>{" = "}
                    <span className="text-purple-400">await</span>
                    {" response."}
                    <span className="text-blue-400">json</span>{"();\n"}
                    <span className="text-blue-400">console</span>
                    {"."}
                    <span className="text-blue-400">log</span>
                    {"(data);"}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 border-t border-border/40 bg-card/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[300px] md:h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-6">Ready to start building?</h2>
          <p className="text-muted-foreground text-base md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto">
            Explore our comprehensive documentation and start integrating Trustbit API into your applications today.
          </p>
          <Link href="/docs">
            <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 font-mono text-sm md:text-base">
              View Documentation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
