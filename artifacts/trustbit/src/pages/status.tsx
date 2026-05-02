import { useGetApiStatus, useHealthCheck } from "@workspace/api-client-react";
import { Activity, Server, Clock, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(days + "d");
  if (hours > 0) parts.push(hours + "h");
  if (mins > 0) parts.push(mins + "m");
  return parts.length > 0 ? parts.join(" ") : "< 1m";
}

export default function Status() {
  const { data: statusData, isLoading: isLoadingStatus, isError: isStatusError } = useGetApiStatus();
  const { data: healthData, isLoading: isLoadingHealth, isError: isHealthError } = useHealthCheck();

  const loading = isLoadingStatus || isLoadingHealth;
  const isOperational = !isStatusError && statusData?.status === "active" && !isHealthError && healthData?.status === "ok";

  const indicatorBg = loading
    ? "bg-card border-border/50"
    : isOperational
    ? "bg-green-500/10 border-green-500/20"
    : "bg-destructive/10 border-destructive/20";

  const iconBg = loading
    ? "bg-muted text-muted-foreground"
    : isOperational
    ? "bg-green-500/20 text-green-500"
    : "bg-destructive/20 text-destructive";

  const statusText = loading
    ? "Checking status..."
    : isOperational
    ? "All Systems Operational"
    : "Service Disruption";

  const statusSubText = loading
    ? "text-muted-foreground"
    : isOperational
    ? "text-green-500/80"
    : "text-destructive/80";

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Platform Status</h1>
        <p className="text-xl text-muted-foreground">Current operational status of Trustbit API services.</p>
      </div>

      {/* Main Status Indicator */}
      <div
        data-testid="status-main-indicator"
        className={"rounded-xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border " + indicatorBg}
      >
        <div className="flex items-center gap-6">
          <div className={"flex h-20 w-20 items-center justify-center rounded-full " + iconBg}>
            {loading ? (
              <Activity className="h-10 w-10 animate-pulse" />
            ) : isOperational ? (
              <CheckCircle2 className="h-10 w-10" />
            ) : (
              <XCircle className="h-10 w-10" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2" data-testid="text-status-headline">{statusText}</h2>
            <p className={"text-lg " + statusSubText}>Updated just now</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
              <Server className="h-4 w-4 mr-2" /> Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold" data-testid="text-total-endpoints">
              {isLoadingStatus ? <Skeleton className="h-9 w-20" /> : statusData?.totalEndpoints ?? "0"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
              <Clock className="h-4 w-4 mr-2" /> Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold" data-testid="text-uptime">
              {isLoadingStatus ? <Skeleton className="h-9 w-32" /> : formatUptime(statusData?.uptime ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
              <GitBranch className="h-4 w-4 mr-2" /> Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold" data-testid="text-version">
              {isLoadingStatus ? <Skeleton className="h-9 w-24" /> : statusData?.version ?? "1.0.0"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2" /> Core API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-1">
              {isLoadingHealth ? (
                <Skeleton className="h-6 w-20 rounded-full" />
              ) : healthData?.status === "ok" ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Healthy</Badge>
              ) : (
                <Badge variant="destructive">Degraded</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="p-6 border-b border-border/40 bg-muted/20">
          <h3 className="text-xl font-semibold">Service Details</h3>
        </div>
        <div className="divide-y divide-border/40">
          {[
            { name: "API Gateway", status: isOperational ? "Operational" : "Degraded" },
            { name: "Authentication", status: isOperational ? "Operational" : "Degraded" },
            { name: "Database Cluster", status: "Operational" },
            { name: "Edge Caching", status: "Operational" },
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between p-6" data-testid={"row-service-" + service.name.replace(/\s+/g, "-").toLowerCase()}>
              <div className="font-medium">{service.name}</div>
              <div className="flex items-center gap-2">
                <div className={"h-2.5 w-2.5 rounded-full " + (service.status === "Operational" ? "bg-green-500" : "bg-destructive")} />
                <span className="text-sm text-muted-foreground">{service.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
