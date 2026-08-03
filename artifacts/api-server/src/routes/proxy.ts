import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SOURCE_BASE = "https://prexzyapis.com";

const BLOCKED_PREFIXES = ["/nsfw", "/home"];

// Keys to strip from JSON responses
const OMIT_KEYS = new Set([
  "apiUrl", "api_url", "source", "sourceUrl", "source_url",
  "host", "poweredBy", "powered_by", "upstream", "origin",
  "server", "backend", "provider",
]);

// Response headers from upstream we must NOT forward
const STRIP_RESPONSE_HEADERS = new Set([
  "server", "x-powered-by", "via", "x-cache", "x-amz-cf-id",
  "x-amz-cf-pop", "cf-ray", "cf-cache-status", "cf-request-id",
  "x-request-id", "x-trace-id", "x-backend", "x-upstream",
  "set-cookie", "alt-svc", "nel", "report-to",
  "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset",
]);

// Brand/source scrubbing patterns — replace any leak of upstream identity
const BRAND_PATTERNS: [RegExp, string][] = [
  [/zstlab\.cyou/gi,        "trustbit.app"],
  [/zst[\s-]*labs?/gi,      "Trustbit"],
  [/godszeal/gi,            "Trustbit Team"],
  [/prexzyapis\.com/gi,     "trustbit.app"],
  [/prexzy\s*apis?/gi,      "Trustbit"],
  [/\bprexzy\b/gi,          "Trustbit"],
  [/cartoonsarea\.cc/gi,    "trustbit.app"],
  [/cartoonsarea/gi,        "Trustbit Media"],
];

function scrubString(s: string): string {
  let out = s;
  for (const [pattern, repl] of BRAND_PATTERNS) out = out.replace(pattern, repl);
  return out;
}

function sanitizeBody(body: unknown): unknown {
  if (typeof body === "string") return scrubString(body);
  if (Array.isArray(body)) return body.map(sanitizeBody);
  if (typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "creator") { result[k] = "Trustbit"; continue; }
      if (OMIT_KEYS.has(k)) continue;
      result[k] = sanitizeBody(v);
    }
    return result;
  }
  return body;
}

router.use(async (req, res, next): Promise<void> => {
  const reqPath = req.path;

  if (BLOCKED_PREFIXES.some((p) => reqPath === p || reqPath.startsWith(p + "/"))) {
    res.status(404).json({ status: false, error: "Endpoint not found" });
    return;
  }

  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = `${SOURCE_BASE}${reqPath}${qs}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TrustbitBot/1.0)",
        "Accept": "application/json, */*",
        // Do NOT forward any client headers — prevents header injection
      },
      signal: AbortSignal.timeout(30000),
    });

    const contentType = response.headers.get("content-type") ?? "";

    // Binary responses — forward content-type only, strip all other headers
    if (contentType.includes("image/") || contentType.includes("audio/")) {
      res.status(response.status).set("Content-Type", contentType);
      res.send(Buffer.from(await response.arrayBuffer()));
      return;
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      // Only set Content-Type — never forward upstream headers
      res.status(response.status).json(sanitizeBody(json));
    } catch {
      res.status(response.status).json({
        status: false,
        error: response.status === 404
          ? "Endpoint not found"
          : "An error occurred. Please try again.",
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
