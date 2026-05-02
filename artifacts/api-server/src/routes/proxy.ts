import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SOURCE_BASE = "https://apis.prexzyvilla.site";

const ALLOWED_PREFIXES = [
  "/ai/",
  "/anime/",
  "/dl/",
  "/game/",
  "/img/",
  "/movie/",
  "/search/",
  "/random/",
  "/audio/",
  "/sport/",
  "/ss/",
  "/stalk/",
  "/text/",
  "/tools/",
  "/short/",
  "/style/",
  "/tts/",
  "/vnum/",
];

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

router.get("/{*splat}", async (req, res): Promise<void> => {
  const splat = Array.isArray(req.params.splat) ? req.params.splat[0] : req.params.splat;
  const reqPath = "/" + splat;

  const isAllowed = ALLOWED_PREFIXES.some((p) => reqPath.startsWith(p));
  if (!isAllowed) {
    res.status(404).json({ status: false, error: "Endpoint not found" });
    return;
  }

  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = `${SOURCE_BASE}${reqPath}${qs}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "TrustbitAPI/1.0",
        Accept: "application/json, */*",
      },
      signal: AbortSignal.timeout(30000),
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json") || contentType.includes("text/json")) {
      const json = await response.json();
      const rewritten = rewriteCreator(json);
      res.status(response.status).json(rewritten);
    } else if (contentType.includes("image/")) {
      res.status(response.status).set("Content-Type", contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else if (contentType.includes("audio/")) {
      res.status(response.status).set("Content-Type", contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        const rewritten = rewriteCreator(json);
        res.status(response.status).json(rewritten);
      } catch {
        res.status(response.status).set("Content-Type", contentType || "text/plain").send(text);
      }
    }
  } catch (err) {
    req.log.error({ err, targetUrl }, "Proxy request failed");
    res.status(502).json({ status: false, error: "Upstream request failed" });
  }
});

export default router;
