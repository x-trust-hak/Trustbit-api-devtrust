/**
 * security.ts — Multi-layer request firewall.
 *
 * Layers (in order):
 *   1. Strip X-Powered-By + inject fake server header
 *   2. Block known scanner / attack tool User-Agents
 *   3. IP-level rate limit (unauthenticated burst protection)
 *   4. Suspicious path detection (traversal, injection, probing)
 *   5. Honeypot sink — auto-blocks IPs that probe known attack targets
 */

import type { Request, Response, NextFunction } from "express";

// ─── 1. Fingerprint masking ───────────────────────────────────────────────────

export function maskFingerprint(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Served-By", "TrustbitEdge/2.0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}

// ─── 2. Scanner / bot User-Agent blocklist ────────────────────────────────────

const BLOCKED_UA: RegExp[] = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zgrab/i,
  /dirbuster/i, /gobuster/i, /wfuzz/i, /hydra/i,
  /burpsuite/i, /burp\s?suite/i,
  /scrapy/i, /libwww-perl/i, /go-http-client\//i,
  /python-urllib\//i, /java\/\d/i,
  /nuclei\//i, /acunetix/i, /openvas/i, /nessus/i,
  /metasploit/i, /havij/i, /paros/i, /webinspect/i,
  /w3af/i, /skipfish/i, /arachni/i, /vega\//i,
  /owasp\+zap/i, /zaproxy/i,
];

export function blockScanners(req: Request, res: Response, next: NextFunction): void {
  const ua = req.headers["user-agent"] ?? "";
  if (BLOCKED_UA.some((rx) => rx.test(ua))) {
    res.status(403).json({ status: false, error: "Forbidden" });
    return;
  }
  next();
}

// ─── 3. IP-level rate limiter (before auth — catches unauthenticated floods) ──

const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 120; // per IP per minute across ALL routes

interface IpBucket { count: number; resetAt: number }
const ipBuckets = new Map<string, IpBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of ipBuckets) if (b.resetAt <= now) ipBuckets.delete(k);
}, IP_WINDOW_MS).unref();

// Temporary ban list: IPs that triggered honeypot get 30-min blackout
const bannedIps = new Map<string, number>(); // ip → expiry timestamp

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0].trim();
  return raw ?? req.socket.remoteAddress ?? "unknown";
}

export function ipRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();

  // Check ban list first
  const banExpiry = bannedIps.get(ip);
  if (banExpiry) {
    if (now < banExpiry) {
      res.status(403).json({ status: false, error: "Forbidden" });
      return;
    }
    bannedIps.delete(ip);
  }

  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= IP_MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.status(429).set("Retry-After", String(retryAfter)).json({
      status: false,
      error: "Too many requests. Please slow down.",
    });
    return;
  }

  bucket.count++;
  next();
}

// ─── 4. Suspicious path / payload detection ───────────────────────────────────

const ATTACK_PATTERNS: RegExp[] = [
  // Path traversal
  /\.\.[/\\]/,
  /%2e%2e[%2f%5c]/i,
  // SQL injection hints in path
  /(\bor\b|\band\b)\s+[\d'"]/i,
  /union.*select/i,
  /drop\s+table/i,
  // XSS in path
  /<script/i,
  /javascript:/i,
  // Common file probes
  /\/etc\/passwd/,
  /\/proc\/self/,
  /\/windows\/win\.ini/i,
  /\.git\//,
  /\.env(\b|$)/,
  /web\.config/i,
  // PHP / CMS fingerprinting
  /\.php(\?|$)/i,
  /wp-login/i,
  /wp-admin/i,
  /phpmyadmin/i,
  /adminer/i,
  /cpanel/i,
  // Shell injection
  /;(\s*)(ls|cat|wget|curl|bash|sh|cmd|powershell)/i,
  /`[^`]+`/,
];

export function blockAttackPatterns(req: Request, res: Response, next: NextFunction): void {
  const target = decodeURIComponent(req.url);
  if (ATTACK_PATTERNS.some((rx) => rx.test(target))) {
    const ip = getClientIp(req);
    // Escalate: ban this IP for 30 minutes
    bannedIps.set(ip, Date.now() + 30 * 60 * 1000);
    res.status(404).json({ status: false, error: "Not found" });
    return;
  }
  next();
}

// ─── 5. Honeypot — attracts scanners and bans them ───────────────────────────

const HONEYPOT_PATHS = new Set([
  "/admin", "/administrator", "/wp-admin", "/wp-login.php",
  "/phpmyadmin", "/pma", "/adminer", "/cpanel",
  "/config", "/config.json", "/config.php", "/settings.php",
  "/.env", "/.git", "/.git/config",
  "/api/v1", "/api/v0", "/api/debug", "/api/internal",
  "/api/admin/shell", "/api/dump", "/api/backup",
  "/xmlrpc.php", "/api.php", "/shell.php", "/cmd.php",
]);

export function honeypot(req: Request, res: Response, next: NextFunction): void {
  const path = req.path.toLowerCase().replace(/\/+$/, "");
  if (HONEYPOT_PATHS.has(path)) {
    const ip = getClientIp(req);
    bannedIps.set(ip, Date.now() + 30 * 60 * 1000);
    // Respond slowly to waste scanner time — small delay, but cap it
    setTimeout(() => {
      res.status(404).json({ status: false, error: "Not found" });
    }, 800);
    return;
  }
  next();
}

// ─── 6. Error sanitizer — never leak stack traces or internals ────────────────

export function sanitizeErrors(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log internally (pino already handles this above this middleware)
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode
    ?? 500;

  res.status(status).json({ status: false, error: "An error occurred. Please try again." });
}
