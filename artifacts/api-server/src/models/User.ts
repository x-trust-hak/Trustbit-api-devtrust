import mongoose, { Schema, type Document } from "mongoose";
import crypto from "node:crypto";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  apiKey: string;
  plan: "free" | "biweekly" | "monthly" | "lifetime";
  credits: number;
  totalRequests: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  apiKey: { type: String, unique: true, default: () => "tb_" + crypto.randomBytes(20).toString("hex") },
  plan: { type: String, enum: ["free", "biweekly", "monthly", "lifetime"], default: "free" },
  credits: { type: Number, default: 100 },
  totalRequests: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models["User"] as mongoose.Model<IUser> | undefined
  ?? mongoose.model<IUser>("User", UserSchema);
