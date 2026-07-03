import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { isConnected } from "../lib/db";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isConnected()) {
    res.status(503).json({ status: false, error: "Service temporarily unavailable. Please try again shortly." });
    return;
  }

  const headerKey = req.headers["x-api-key"];
  const queryKey = req.query["apikey"];
  const apiKey = (typeof headerKey === "string" ? headerKey : Array.isArray(headerKey) ? headerKey[0] : undefined)
    ?? (typeof queryKey === "string" ? queryKey : undefined);

  if (!apiKey) {
    res.status(401).json({
      status: false,
      error: "API key required. Create a free account to get your key.",
      signup: "/register",
    });
    return;
  }

  let user;
  try {
    user = await User.findOne({ apiKey });
  } catch (err) {
    req.log.error({ err }, "API key lookup failed");
    res.status(500).json({ status: false, error: "Internal error" });
    return;
  }

  if (!user) {
    res.status(401).json({ status: false, error: "Invalid API key.", signup: "/register" });
    return;
  }

  const isUnlimited = user.unlimited || user.credits === -1;

  if (!isUnlimited) {
    const { allowed, retryAfterSec } = checkRateLimit(String(user._id));
    if (!allowed) {
      res.status(429).set("Retry-After", String(retryAfterSec)).json({
        status: false,
        error: "Rate limit exceeded. Please slow down.",
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    if (user.credits <= 0) {
      res.status(402).json({
        status: false,
        error: "Out of credits. Upgrade your plan to continue.",
        upgrade: "/upgrade",
      });
      return;
    }
  }

  try {
    await User.updateOne(
      { _id: user._id },
      isUnlimited
        ? { $inc: { totalRequests: 1 } }
        : { $inc: { totalRequests: 1, credits: -1 } }
    );
  } catch (err) {
    req.log.error({ err }, "Failed to record request usage");
  }

  next();
}
