import mongoose, { Schema, type Document } from "mongoose";

export type PlanId = "weekly" | "biweekly" | "monthly";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email: string;
  plan: PlanId;
  amount: number;
  screenshotData: string;
  screenshotMime: string;
  status: "pending" | "approved" | "declined";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  plan: { type: String, enum: ["weekly", "biweekly", "monthly"], required: true },
  amount: { type: Number, required: true },
  screenshotData: { type: String, required: true },
  screenshotMime: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
  adminNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PaymentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Payment = mongoose.models["Payment"] as mongoose.Model<IPayment> | undefined
  ?? mongoose.model<IPayment>("Payment", PaymentSchema);
