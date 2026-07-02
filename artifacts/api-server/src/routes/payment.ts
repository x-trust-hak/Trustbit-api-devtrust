import { Router, type IRouter, type Request, type Response } from "express";
import { Payment, PLAN_CREDITS, PLAN_AMOUNTS } from "../models/Payment";
import { User } from "../models/User";
import { verifyToken } from "./auth";
import { isConnected } from "../lib/db";

const router: IRouter = Router();
const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "trustbit-admin-2026";

function dbGuard(res: Response): boolean {
  if (!isConnected()) {
    res.status(503).json({ error: "Database not configured" });
    return false;
  }
  return true;
}

function getUser(req: Request): { userId: string; email: string } | null {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

router.post("/payment/submit", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  const payload = getUser(req);
  if (!payload) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  const { plan, screenshotData, screenshotMime } = req.body as {
    plan?: string;
    screenshotData?: string;
    screenshotMime?: string;
  };

  if (!plan || !["biweekly", "monthly", "lifetime"].includes(plan)) {
    res.status(400).json({ error: "Invalid plan. Choose biweekly, monthly, or lifetime" });
    return;
  }
  if (!screenshotData || !screenshotMime) {
    res.status(400).json({ error: "Payment screenshot required" });
    return;
  }
  if (!screenshotMime.startsWith("image/")) {
    res.status(400).json({ error: "Screenshot must be an image" });
    return;
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = await Payment.findOne({ userId: user._id, status: "pending" });
    if (existing) {
      res.status(409).json({ error: "You already have a pending payment submission. Wait for admin review." });
      return;
    }

    const payment = await Payment.create({
      userId: user._id,
      username: user.username,
      email: user.email,
      plan,
      amount: PLAN_AMOUNTS[plan],
      screenshotData,
      screenshotMime,
    });

    res.status(201).json({ ok: true, paymentId: payment._id, status: "pending", message: "Submission received. Admin will review within 24 hours." });
  } catch (err) {
    req.log.error({ err }, "Payment submit failed");
    res.status(500).json({ error: "Failed to submit payment" });
  }
});

router.get("/payment/list", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const status = (req.query["status"] as string) || "pending";
    const payments = await Payment.find(status === "all" ? {} : { status })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      payments: payments.map((p) => ({
        id: p._id,
        username: p.username,
        email: p.email,
        plan: p.plan,
        amount: p.amount,
        status: p.status,
        adminNote: p.adminNote,
        screenshotMime: p.screenshotMime,
        screenshotData: p.screenshotData,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total: await Payment.countDocuments(status === "all" ? {} : { status }),
    });
  } catch (err) {
    req.log.error({ err }, "Payment list failed");
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.post("/payment/:id/approve", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const payment = await Payment.findById(req.params["id"]);
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    if (payment.status !== "pending") {
      res.status(409).json({ error: "Payment already processed" });
      return;
    }

    const credits = PLAN_CREDITS[payment.plan] ?? 0;
    const user = await User.findById(payment.userId);
    if (user) {
      if (credits === -1) {
        user.plan = "lifetime";
        user.credits = -1;
      } else {
        user.plan = payment.plan as "biweekly" | "monthly";
        user.credits = (user.credits < 0 ? 0 : user.credits) + credits;
      }
      await user.save();
    }

    payment.status = "approved";
    payment.adminNote = (req.body as { note?: string }).note ?? "Payment approved";
    await payment.save();

    res.json({ ok: true, credits, plan: payment.plan });
  } catch (err) {
    req.log.error({ err }, "Payment approve failed");
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

router.post("/payment/:id/decline", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  if (req.query["key"] !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const payment = await Payment.findById(req.params["id"]);
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    payment.status = "declined";
    payment.adminNote = (req.body as { note?: string }).note ?? "Payment declined";
    await payment.save();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Payment decline failed");
    res.status(500).json({ error: "Failed to decline payment" });
  }
});

router.get("/payment/my", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  const payload = getUser(req);
  if (!payload) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  try {
    const payments = await Payment.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-screenshotData");
    res.json({ payments });
  } catch (err) {
    req.log.error({ err }, "My payments failed");
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

export default router;
