import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import NotFound from "@/pages/not-found";

const Home = lazy(() => import("@/pages/home"));
const Docs = lazy(() => import("@/pages/docs"));
const Status = lazy(() => import("@/pages/status"));
const Admin = lazy(() => import("@/pages/admin"));
const Portfolio = lazy(() => import("@/pages/portfolio"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Upgrade = lazy(() => import("@/pages/upgrade"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

const STANDALONE_ROUTES = ["/admin", "/login", "/register", "/dashboard", "/upgrade"];

function Router() {
  return (
    <Switch>
      {/* Standalone pages — no navbar/footer */}
      <Route path="/admin">
        <Suspense fallback={<PageLoader />}><Admin /></Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<PageLoader />}><Login /></Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<PageLoader />}><Register /></Suspense>
      </Route>
      <Route path="/dashboard">
        <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
      </Route>
      <Route path="/upgrade">
        <Suspense fallback={<PageLoader />}><Upgrade /></Suspense>
      </Route>

      {/* Main shell — with navbar + footer */}
      <Route>
        <div className="min-h-screen flex flex-col bg-background text-foreground dark selection:bg-primary/30 selection:text-primary">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/docs" component={Docs} />
                <Route path="/status" component={Status} />
                <Route path="/portfolio" component={Portfolio} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    const path = window.location.pathname;
    if (!STANDALONE_ROUTES.some((r) => path.startsWith(r))) {
      fetch("/api/visitors/ping", { method: "POST" }).catch(() => null);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
