interface HourBucket {
  hour: number;
  requests: number;
  errors: number;
  bytes: number;
}

interface EndpointStat {
  path: string;
  count: number;
  errors: number;
  totalMs: number;
}

export interface RecentRequest {
  id: number;
  method: string;
  path: string;
  status: number;
  ms: number;
  bytes: number;
  ts: number;
}

class MetricsStore {
  readonly startedAt = Date.now();
  totalRequests = 0;
  totalErrors = 0;
  totalBytes = 0;
  private endpoints = new Map<string, EndpointStat>();
  private hourBuckets: HourBucket[] = [];
  readonly recentRequests: RecentRequest[] = [];
  private reqId = 0;

  private getBucket(): HourBucket {
    const hourStart = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    let b = this.hourBuckets.find((x) => x.hour === hourStart);
    if (!b) {
      b = { hour: hourStart, requests: 0, errors: 0, bytes: 0 };
      this.hourBuckets.push(b);
      if (this.hourBuckets.length > 48) this.hourBuckets.splice(0, this.hourBuckets.length - 48);
    }
    return b;
  }

  record(path: string, method: string, status: number, ms: number, bytes: number): void {
    this.totalRequests++;
    this.totalBytes += bytes;
    const isErr = status >= 400;
    if (isErr) this.totalErrors++;

    const ep = this.endpoints.get(path) ?? { path, count: 0, errors: 0, totalMs: 0 };
    ep.count++;
    ep.totalMs += ms;
    if (isErr) ep.errors++;
    this.endpoints.set(path, ep);

    const b = this.getBucket();
    b.requests++;
    b.bytes += bytes;
    if (isErr) b.errors++;

    this.recentRequests.unshift({ id: ++this.reqId, method, path, status, ms, bytes, ts: Date.now() });
    if (this.recentRequests.length > 100) this.recentRequests.length = 100;
  }

  getStats() {
    const now = Date.now();
    const hourBuckets24 = Array.from({ length: 24 }, (_, i) => {
      const h = Math.floor((now - (23 - i) * 3_600_000) / 3_600_000) * 3_600_000;
      const found = this.hourBuckets.find((b) => b.hour === h);
      const d = new Date(h);
      return {
        hour: h,
        label: d.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }),
        requests: found?.requests ?? 0,
        errors: found?.errors ?? 0,
        bytes: found?.bytes ?? 0,
      };
    });

    const topEndpoints = Array.from(this.endpoints.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((ep) => ({
        path: ep.path,
        count: ep.count,
        errors: ep.errors,
        avgMs: ep.count > 0 ? Math.round(ep.totalMs / ep.count) : 0,
      }));

    const allEps = Array.from(this.endpoints.values());
    const totalMs = allEps.reduce((s, e) => s + e.totalMs, 0);
    const totalCount = allEps.reduce((s, e) => s + e.count, 0);

    return {
      startedAt: this.startedAt,
      uptime: Math.floor((now - this.startedAt) / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      totalBytes: this.totalBytes,
      successRate:
        this.totalRequests > 0
          ? Math.round(((this.totalRequests - this.totalErrors) / this.totalRequests) * 10000) / 100
          : 100,
      avgResponseMs: totalCount > 0 ? Math.round(totalMs / totalCount) : 0,
      hourBuckets: hourBuckets24,
      topEndpoints,
      recentRequests: this.recentRequests.slice(0, 50),
    };
  }
}

export const metrics = new MetricsStore();
