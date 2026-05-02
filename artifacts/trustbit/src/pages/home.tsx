import { Link } from "wouter";
import { ArrowRight, Terminal, Zap, Layers, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiStatus, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: statusData, isLoading: isLoadingStatus } = useGetApiStatus();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();

  const codeSnippet = `// Quick Start
const response = await fetch('https://trustbitapi.replit.app/api/ai/aichat?prompt=hello', {
  headers: {
    'Accept': 'application/json'
  }
});
const data = await response.json();
console.log(data);`;

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
              <Zap className="mr-2 h-4 w-4" />
              <span>v1.0.0 is now live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
              The secret weapon in every <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                developer's toolkit.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Instant access to AI, anime, downloaders, tools, and more. 
              One unified API. Zero friction. Built for speed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/docs">
                <Button size="lg" className="h-12 px-8 font-mono text-sm group">
                  <Terminal className="mr-2 h-4 w-4" />
                  Explore Endpoints
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/status">
                <Button size="lg" variant="outline" className="h-12 px-8 border-border hover:bg-muted">
                  View Platform Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/40">
            <div className="text-center px-4">
              <div className="text-3xl font-mono font-bold text-primary mb-1">
                {isLoadingStatus ? <Skeleton className="h-9 w-24 mx-auto" /> : statusData?.totalEndpoints || "550+"}
              </div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Endpoints</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl font-mono font-bold text-primary mb-1">
                {isLoadingCategories ? <Skeleton className="h-9 w-24 mx-auto" /> : categoriesData?.total || "19+"}
              </div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Categories</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl font-mono font-bold text-primary mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Uptime</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl font-mono font-bold text-primary mb-1">&lt;50ms</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Snippet & Features */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Integrate in seconds.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Stop managing dozens of API keys and inconsistent documentation. 
              Trustbit unifies the most powerful tools behind a single, elegant interface.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: Layers, title: "Unified Architecture", desc: "One structure to learn. Use it everywhere." },
                { icon: Shield, title: "Enterprise Grade", desc: "Built on edge infrastructure for minimal latency." },
                { icon: Code, title: "Developer First", desc: "Types, clear errors, and copy-paste examples." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <feature.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/50 to-blue-500/50 opacity-20 blur-xl transition duration-500 group-hover:opacity-40"></div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
              <div className="flex items-center px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-muted-foreground">example.js</div>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="font-mono text-sm leading-loose">
                  <code className="text-foreground">
                    <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-green-400">'https://trustbitapi.replit.app/api/ai/aichat?prompt=hello'</span>, {'{'}
                    {"\n  "}headers: {'{'}
                    {"\n    "}<span className="text-green-400">'Accept'</span>: <span className="text-green-400">'application/json'</span>
                    {"\n  "}{'}'}
                    {"\n"}{'}'});
                    {"\n"}<span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> response.<span className="text-blue-400">json</span>();
                    {"\n"}<span className="text-blue-400">console</span>.<span className="text-blue-400">log</span>(data);
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/40 bg-card/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start building?</h2>
          <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto">
            Explore our comprehensive documentation and start integrating Trustbit API into your applications today.
          </p>
          <Link href="/docs">
            <Button size="lg" className="h-14 px-10 font-mono text-base">
              View Documentation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
