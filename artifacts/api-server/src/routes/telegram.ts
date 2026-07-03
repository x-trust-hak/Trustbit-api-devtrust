import { Router, type IRouter, type Request, type Response } from "express";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { isConnected } from "../lib/db";
import { metrics, visitors } from "../lib/metrics";
import fs from "node:fs";
import path from "node:path";

const router: IRouter = Router();

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"] ?? "";
const TG_USERS_PATH = path.join(process.cwd(), "tg-users.json");

function getAllowedUsers(): number[] {
  try {
    const raw = fs.readFileSync(TG_USERS_PATH, "utf-8");
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

function isAllowed(userId: number): boolean {
  return getAllowedUsers().includes(userId);
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // best-effort
  }
}

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string };
    chat: { id: number };
    text?: string;
  };
};

async function handleCommand(chatId: number, text: string): Promise<string> {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? "";

  if (cmd === "/start" || cmd === "/help") {
    return (
      "*Trustbit Admin Bot*\n\n" +
      "Commands:\n" +
      "/pending — list pending payment submissions\n" +
      "/approve <id> [note] — approve a payment\n" +
      "/decline <id> [note] — decline a payment\n" +
      "/stats — show API and user stats\n" +
      "/user <email> — look up a user\n" +
      "/unlimited <email> <on|off> — toggle unlimited access"
    );
  }

  if (!isConnected()) {
    return "⚠️ Database not connected — this command is unavailable.";
  }

  if (cmd === "/pending") {
    try {
      const payments = await Payment.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id username email plan amount createdAt");

      if (payments.length === 0) return "✅ No pending payments.";

      const lines = payments.map(
        (p) =>
          `• \`${String(p._id)}\`\n  ${p.username} (${p.email}) — *${p.plan}* $${p.amount}`
      );
      return `*Pending Payments (${payments.length})*\n\n${lines.join("\n\n")}`;
    } catch {
      return "❌ Failed to fetch pending payments.";
    }
  }

  if (cmd === "/approve" || cmd === "/decline") {
    const id = parts[1];
    if (!id) return `Usage: ${cmd} <paymentId> [note]`;
    const note = parts.slice(2).join(" ") || (cmd === "/approve" ? "Approved via Telegram" : "Declined via Telegram");

    try {
      const payment = await Payment.findById(id);
      if (!payment) return `❌ Payment \`${id}\` not found.`;
      if (payment.status !== "pending") return `⚠️ Payment is already *${payment.status}*.`;

      if (cmd === "/approve") {
        const { PLAN_CREDITS, PLAN_AMOUNTS } = await import("../models/Payment");
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
      } else {
        payment.status = "declined";
      }

      payment.adminNote = note;
      await payment.save();

      const icon = cmd === "/approve" ? "✅" : "❌";
      return `${icon} Payment \`${id}\` *${payment.status}*.\n${payment.username} — ${payment.plan}\nNote: ${note}`;
    } catch {
      return `❌ Failed to process payment \`${id}\`.`;
    }
  }

  if (cmd === "/stats") {
    const base = { ...metrics.getStats(), visitors: visitors.getStats() };
    try {
      const [pendingPayments, totalUsers] = await Promise.all([
        Payment.countDocuments({ status: "pending" }),
        User.countDocuments(),
      ]);
      return (
        `*API Stats*\n\n` +
        `👥 Total users: *${totalUsers}*\n` +
        `💳 Pending payments: *${pendingPayments}*\n` +
        `📊 Requests: *${JSON.stringify(base).slice(0, 200)}*`
      );
    } catch {
      return `*API Stats*\n\n${JSON.stringify(base, null, 2).slice(0, 400)}`;
    }
  }

  if (cmd === "/user") {
    const q = parts.slice(1).join(" ").trim();
    if (!q) return "Usage: /user <email or username>";
    try {
      const user = await User.findOne({
        $or: [{ email: q.toLowerCase() }, { username: q }],
      }).select("username email plan credits unlimited totalRequests createdAt");
      if (!user) return `❌ No user found for \`${q}\`.`;
      return (
        `*User: ${user.username}*\n` +
        `Email: ${user.email}\n` +
        `Plan: *${user.plan}*\n` +
        `Credits: ${user.unlimited ? "∞ unlimited" : user.credits}\n` +
        `Total requests: ${user.totalRequests}\n` +
        `Joined: ${new Date(user.createdAt).toDateString()}`
      );
    } catch {
      return "❌ User lookup failed.";
    }
  }

  if (cmd === "/unlimited") {
    const email = parts[1];
    const flag = parts[2]?.toLowerCase();
    if (!email || !["on", "off"].includes(flag ?? "")) {
      return "Usage: /unlimited <email> <on|off>";
    }
    try {
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { unlimited: flag === "on" },
        { new: true }
      );
      if (!user) return `❌ User not found: \`${email}\``;
      return `✅ Unlimited access for *${user.username}* set to *${flag}*.`;
    } catch {
      return "❌ Failed to update user.";
    }
  }

  return `Unknown command: \`${cmd}\`. Send /help for a list of commands.`;
}

router.post("/telegram/webhook", async (req: Request, res: Response): Promise<void> => {
  res.sendStatus(200);

  const update = req.body as TelegramUpdate;
  const msg = update.message;
  if (!msg || !msg.text) return;

  const fromId = msg.from?.id;
  if (!fromId || !isAllowed(fromId)) return;

  const reply = await handleCommand(msg.chat.id, msg.text);
  await sendMessage(msg.chat.id, reply);
});

router.get("/telegram/webhook", (_req: Request, res: Response): void => {
  res.json({ ok: true, info: "Trustbit Telegram admin webhook is active." });
});

export async function notifyAdmin(text: string): Promise<void> {
  const allowed = getAllowedUsers();
  for (const userId of allowed) {
    await sendMessage(userId, text);
  }
}

export default router;
