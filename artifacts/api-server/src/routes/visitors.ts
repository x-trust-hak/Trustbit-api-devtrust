import { Router, type IRouter, type Request, type Response } from "express";
import { visitors } from "../lib/metrics";

const router: IRouter = Router();

router.post("/visitors/ping", (req: Request, res: Response): void => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
    req.socket?.remoteAddress ||
    "unknown";
  visitors.record(ip);
  res.json({ ok: true });
});

export default router;
