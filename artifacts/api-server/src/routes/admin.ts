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
    const now = Date.now();
    const todayStart  = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart   = new Date(now - 7  * 86400000);
    const monthStart  = new Date(now - 30 * 86400000);

    const [pendingPayments, totalUsers, todaySignups, weekSignups, monthSignups, rawChart] =
      await Promise.all([
        Payment.countDocuments({ status: "pending" }),
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        User.countDocuments({ createdAt: { $gte: weekStart } }),
        User.countDocuments({ createdAt: { $gte: monthStart } }),
        User.aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: monthStart } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Fill every day of the last 30 days (including days with 0 signups)
    const signupMap = new Map(rawChart.map((r) => [r._id, r.count]));
    const signupChart: { date: string; signups: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d   = new Date(now - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      signupChart.push({ date: label, signups: signupMap.get(key) ?? 0 });
    }

    const signupStats = { todaySignups, weekSignups, monthSignups, totalUsers, signupChart };

    res.json({ ...base, pendingPayments, totalUsers, signupStats });
  } catch {
    res.json({ ...base, pendingPayments: 0, totalUsers: 0, signupStats: null });
  }
});

export default router;
