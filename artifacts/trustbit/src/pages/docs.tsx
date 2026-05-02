import { useState, useMemo } from "react";
import { useListEndpoints, useListCategories } from "@workspace/api-client-react";
import { Search, Copy, Check, Terminal, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = "https://trustbitapi.replit.app";

export default function Docs() {
  const { data: endpointsData, isLoading: isLoadingEndpoints } = useListEndpoints();
  const { data: categoriesData, isLoading: isLoadingCategories } = useListCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (path: string) => {
    const normalizedPath = path.startsWith("/api") ? path : "/api" + path;
    const fullUrl = BASE_URL + normalizedPath;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    toast({
      title: "Copied to clipboard",
      description: "API endpoint URL copied.",
      duration: 2000,
    });
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    if (!endpointsData?.categories) return [];

    return endpointsData.categories
      .map((category) => {
        const filteredItems = category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.path.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...category, items: filteredItems };
      })
      .filter((category) => category.items.length > 0);
  }, [endpointsData, searchQuery]);

  const displayCategories = useMemo(() => {
    if (activeCategory === "all") return filteredCategories;
    return filteredCategories.filter((cat) => cat.name === activeCategory);
  }, [filteredCategories, activeCategory]);

  const sidebarBtnClass = (active: boolean) =>
    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors " +
    (active
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground");

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-border/40 bg-card/30 md:block hidden h-[calc(100vh-4rem)] sticky top-16">
        <ScrollArea className="h-full py-6 pr-4 pl-4 md:pl-8">
          <div className="mb-6 px-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
            <div className="space-y-1">
              <button
                data-testid="btn-category-all"
                onClick={() => setActiveCategory("all")}
                className={sidebarBtnClass(activeCategory === "all")}
              >
                <span>All Endpoints</span>
                {endpointsData && (
                  <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">
                    {endpointsData.totalEndpoints}
                  </span>
                )}
              </button>

              {isLoadingCategories
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md mt-1" />
                  ))
                : categoriesData?.categories?.map((cat) => (
                    <button
                      key={cat.name}
                      data-testid={"btn-category-" + cat.slug}
                      onClick={() => setActiveCategory(cat.name)}
                      className={sidebarBtnClass(activeCategory === cat.name)}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full shrink-0">
                        {cat.count}
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">API Reference</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Base URL for all API requests:
              <code className="ml-2 px-2 py-1 bg-muted rounded-md text-primary font-mono text-sm border border-primary/20">
                {BASE_URL}
              </code>
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                data-testid="input-search-endpoints"
                placeholder="Search endpoints by name, description, or path..."
                className="w-full pl-10 h-12 bg-card border-border/50 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Mobile Category Pills */}
            <div className="mt-4 md:hidden flex overflow-x-auto pb-2 gap-2 snap-x">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="shrink-0 snap-start"
              >
                All
              </Button>
              {categoriesData?.categories?.map((cat) => (
                <Button
                  key={cat.name}
                  variant={activeCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.name)}
                  className="shrink-0 snap-start"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {isLoadingEndpoints ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))
            ) : displayCategories.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                <Terminal className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No endpoints found</h3>
                <p className="text-muted-foreground">We couldn&apos;t find any endpoints matching your search.</p>
              </div>
            ) : (
              displayCategories.map((category) => (
                <div
                  key={category.name}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/30 sticky top-16 bg-background/95 backdrop-blur z-10 pt-4">
                    <h2 className="text-2xl font-bold capitalize tracking-tight text-foreground/90">
                      {category.name}
                    </h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                      {category.items.length}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {category.items.map((endpoint, i) => {
                      const fullPath = endpoint.path.startsWith("/api")
                        ? endpoint.path
                        : "/api" + endpoint.path;

                      return (
                        <div
                          key={category.name + "-" + i}
                          data-testid={"card-endpoint-" + i}
                          className="group rounded-xl border border-border/40 bg-card/40 p-5 hover:bg-card hover:border-primary/30 transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-2">{endpoint.name}</h3>
                              <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                                {endpoint.desc}
                              </p>

                              <div className="flex items-center bg-background border border-border/50 rounded-lg p-1 max-w-full overflow-hidden">
                                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 mr-2 rounded-md font-mono shrink-0">
                                  GET
                                </Badge>
                                <code className="flex-1 text-sm font-mono text-muted-foreground truncate overflow-hidden text-ellipsis px-1 select-all">
                                  {fullPath}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={"button-copy-" + i}
                                  className="shrink-0 h-8 w-8 ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleCopy(fullPath)}
                                  title="Copy URL"
                                >
                                  {copiedPath === fullPath ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="shrink-0 hidden sm:flex">
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={"button-try-" + i}
                                className="font-mono text-xs border-primary/20 hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50 transition-colors"
                                asChild
                              >
                                <a
                                  href={BASE_URL + fullPath}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Zap className="mr-1.5 h-3 w-3" /> Try It
                                </a>
                              </Button>
                            </div>
                          </div>
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
