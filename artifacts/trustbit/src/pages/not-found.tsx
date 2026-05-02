import { Link } from "wouter";
import { Terminal, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-md w-full text-center relative z-10 bg-card/50 backdrop-blur border border-border/50 p-10 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <Terminal size={32} />
        </div>
        
        <h1 className="text-8xl font-bold font-mono text-primary mb-2 tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Endpoint Not Found</h2>
        
        <p className="text-muted-foreground mb-8">
          The requested route doesn't exist. Check the documentation for available endpoints.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto font-mono hover:bg-muted border-border">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link href="/docs">
            <Button className="w-full sm:w-auto font-mono">
              View Documentation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
