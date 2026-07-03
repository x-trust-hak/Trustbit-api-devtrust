import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { isConnected } from "../lib/db";

const router: IRouter = Router();
const JWT_SECRET = process.env["JWT_SECRET"] ?? "trustbit-jwt-secret-2026";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

function dbGuard(res: Response): boolean {
  if (!isConnected()) {
    res.status(503).json({ error: "Database not configured" });
    return false;
  }
  return true;
}

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  if (!username || !email || !password) {
    res.status(400).json({ error: "username, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  try {
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      res.status(409).json({ error: "Email or username already taken" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    const token = makeToken(String(user._id), user.email);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, apiKey: user.apiKey, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = makeToken(String(user._id), user.email);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, apiKey: user.apiKey, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  if (!dbGuard(res)) return;
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user._id, username: user.username, email: user.email, apiKey: user.apiKey, plan: user.plan, credits: user.unlimited ? -1 : user.credits, unlimited: user.unlimited, totalRequests: user.totalRequests, createdAt: user.createdAt });
  } catch (err) {
    req.log.error({ err }, "Me failed");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
