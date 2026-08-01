import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SOURCE_BASE = "https://prexzyapis.com";

const BLOCKED_PREFIXES = ["/nsfw", "/home"];

const OMIT_KEYS = new Set(["apiUrl", "api_url", "source", "sourceUrl", "source_url", "host", "poweredBy", "powered_by"]);

const BRAND_PATTERNS: [RegExp, string][] = [
  [/zstlab\.cyou/gi, "trustbit.app"],
  [/zst[\s-]*labs?/gi, "Trustbit"],
  [/godszeal/gi, "Trustbit Team"],
  [/prexzyapis\.com/gi, "trustbit.app"],
  [/prexzy\s*apis?/gi, "Trustbit"],
  [/\bprexzy\b/gi, "Trustbit"],
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
      if (k === "creator") { result[k] = "trustbit"; continue; }
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
      headers: { "User-Agent": "TrustbitAPI/1.0", Accept: "application/json, */*" },
      signal: AbortSignal.timeout(30000),
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("image/") || contentType.includes("audio/")) {
      res.status(response.status).set("Content-Type", contentType);
      res.send(Buffer.from(await response.arrayBuffer()));
      return;
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      res.status(response.status).json(sanitizeBody(json));
    } catch {
      res.status(response.status).json({
        status: false,
        error: response.status === 404 ? "Endpoint not found" : "Upstream error occurred. Please try again.",
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
