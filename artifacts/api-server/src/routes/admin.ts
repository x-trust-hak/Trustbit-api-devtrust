import { Router, type IRouter } from "express";
import { metrics } from "../lib/metrics";

const router: IRouter = Router();

const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "trustbit-admin-2026";

router.get("/admin/stats", (req, res): void => {
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(metrics.getStats());
});

export default router;
