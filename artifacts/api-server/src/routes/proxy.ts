import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SOURCE_BASE = "https://prexzyapis.com";
const ZSTLAB_SOURCE = "https://zstlab.cyou";
const ZSTLAB_API_KEY = process.env.ZSTLAB_API_KEY;

const BLOCKED_PREFIXES = ["/nsfw", "/home"];

function rewriteCreator(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return body;
  if (Array.isArray(body)) return body.map(rewriteCreator);
  const obj = body as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "creator") {
      result[k] = "trustbit";
    } else if (typeof v === "object") {
      result[k] = rewriteCreator(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

router.use(async (req, res, next): Promise<void> => {
  const reqPath = req.path;

  if (BLOCKED_PREFIXES.some((p) => reqPath === p || reqPath.startsWith(p + "/"))) {
    res.status(404).json({ status: false, error: "Endpoint not found" });
    return;
  }

  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  const isZstlab = reqPath === "/zst" || reqPath.startsWith("/zst/");
  const targetUrl = isZstlab
    ? `${ZSTLAB_SOURCE}/api${reqPath.slice(4)}${qs}`
    : `${SOURCE_BASE}${reqPath}${qs}`;

  const upstreamHeaders: Record<string, string> = {
    "User-Agent": "TrustbitAPI/1.0",
    Accept: "application/json, */*",
  };
  if (isZstlab && ZSTLAB_API_KEY) {
    upstreamHeaders["x-api-key"] = ZSTLAB_API_KEY;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(30000),
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("image/")) {
      res.status(response.status).set("Content-Type", contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      return;
    }

    if (contentType.includes("audio/")) {
      res.status(response.status).set("Content-Type", contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      return;
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      const rewritten = rewriteCreator(json);
      res.status(response.status).json(rewritten);
    } catch {
      res.status(response.status).set("Content-Type", contentType || "text/plain").send(text);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
