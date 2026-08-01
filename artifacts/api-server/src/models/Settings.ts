import mongoose, { Schema, type Document } from "mongoose";

export interface IPlan {
  id: string;
  label: string;
  duration: string;
  credits: number;
  price: number;
  popular: boolean;
  benefits: string[];
}

export interface IBank {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface ISettings extends Document {
  plans: IPlan[];
  bank: IBank;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>({
  id: { type: String, required: true },
  label: { type: String, required: true },
  duration: { type: String, required: true },
  credits: { type: Number, required: true },
  price: { type: Number, required: true },
  popular: { type: Boolean, default: false },
  benefits: [{ type: String }],
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  plans: [PlanSchema],
  bank: {
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
  },
  updatedAt: { type: Date, default: Date.now },
});

SettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Settings = mongoose.models["Settings"] as mongoose.Model<ISettings> | undefined
  ?? mongoose.model<ISettings>("Settings", SettingsSchema);

export const DEFAULT_PLANS: IPlan[] = [
  {
    id: "weekly",
    label: "1 Week",
    duration: "7 days",
    credits: 3000,
    price: 1500,
    popular: false,
    benefits: ["3,000 API credits", "All endpoints unlocked", "Valid for 7 days"],
  },
  {
    id: "biweekly",
    label: "2 Weeks",
    duration: "14 days",
    credits: 5000,
    price: 2500,
    popular: true,
    benefits: ["5,000 API credits", "All endpoints unlocked", "Valid for 14 days"],
  },
  {
    id: "monthly",
    label: "1 Month",
    duration: "30 days",
    credits: 7000,
    price: 4000,
    popular: false,
    benefits: ["7,000 API credits", "All endpoints unlocked", "Valid for 30 days"],
  },
];

export const DEFAULT_BANK: IBank = {
  accountName: "Praise Philip Jacob",
  accountNumber: "7074435901",
  bankName: "Moniepoint MFB",
};

export async function getSettings(): Promise<{ plans: IPlan[]; bank: IBank }> {
  const doc = await Settings.findOne();
  if (!doc) {
    return { plans: DEFAULT_PLANS, bank: DEFAULT_BANK };
  }
  return {
    plans: doc.plans.length > 0 ? doc.plans : DEFAULT_PLANS,
    bank: doc.bank?.accountName ? doc.bank : DEFAULT_BANK,
  };
}
