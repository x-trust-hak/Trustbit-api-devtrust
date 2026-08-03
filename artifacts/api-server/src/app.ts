import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { existsSync } from "fs";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  maskFingerprint,
  blockScanners,
  ipRateLimit,
  blockAttackPatterns,
  honeypot,
  sanitizeErrors,
} from "./middleware/security";

const app: Express = express();

// ── Fingerprint masking (must be first) ──────────────────────────────────────
app.disable("x-powered-by");
app.use(maskFingerprint);

// ── Security headers via helmet ───────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // API — no HTML to protect
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
  })
);

// ── CORS — allow any origin for API access, but lock methods/headers ──────────
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    maxAge: 86400,
  })
);

// ── Request firewall (order matters) ─────────────────────────────────────────
app.use(honeypot);           // catches scanners probing known paths → bans IP
app.use(blockScanners);      // kills known attack-tool UAs
app.use(ipRateLimit);        // IP-level flood protection before auth
app.use(blockAttackPatterns); // traversal, injection, file probe patterns

// ── Structured request logging ────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        // Strip query strings from logs — never log API keys or params
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Frontend static files ─────────────────────────────────────────────────────
const frontendDist = path.resolve(process.cwd(), "artifacts/trustbit/dist/public");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req: Request, res: Response): void => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// ── Global error handler — never leak internals ───────────────────────────────
app.use(sanitizeErrors);

export default app;
