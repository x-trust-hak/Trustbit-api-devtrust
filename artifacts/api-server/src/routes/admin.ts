import { Router, type IRouter } from "express";
import { metrics, visitors } from "../lib/metrics";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { isConnected } from "../lib/db";

const router: IRouter = Router();
const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "trustbit-admin-2026";

router.post("/admin/users/unlimited", async (req, res): Promise<void> => {
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!isConnected()) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }
  const { email, unlimited } = req.body as { email?: string; unlimited?: boolean };
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  try {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { unlimited: Boolean(unlimited) },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user._id, email: user.email, username: user.username, unlimited: user.unlimited });
  } catch (err) {
    req.log.error({ err }, "Failed to update unlimited flag");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.get("/admin/users/search", async (req, res): Promise<void> => {
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!isConnected()) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }
  const q = String(req.query["q"] ?? "").trim();
  if (!q) {
    res.json({ users: [] });
    return;
  }
  try {
    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    }).limit(10).select("username email plan credits unlimited totalRequests");
    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "User search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

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
