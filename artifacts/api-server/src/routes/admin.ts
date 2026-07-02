import { Router, type IRouter } from "express";
import { metrics, visitors } from "../lib/metrics";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { isConnected } from "../lib/db";

const router: IRouter = Router();
const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "trustbit-admin-2026";

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const base = { ...metrics.getStats(), visitors: visitors.getStats() };

  if (!isConnected()) {
    res.json({ ...base, pendingPayments: 0, totalUsers: 0 });
    return;
  }

  try {
    const [pendingPayments, totalUsers] = await Promise.all([
      Payment.countDocuments({ status: "pending" }),
      User.countDocuments(),
    ]);
    res.json({ ...base, pendingPayments, totalUsers });
  } catch {
    res.json({ ...base, pendingPayments: 0, totalUsers: 0 });
  }
});

export default router;
