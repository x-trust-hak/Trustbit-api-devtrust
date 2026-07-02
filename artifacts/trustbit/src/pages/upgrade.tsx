import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { CreditCard, Upload, CheckCircle2, Clock, ArrowLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  { id: "biweekly", label: "2 Weeks", price: 2500, credits: "5,000 credits", popular: false, perks: ["5,000 API credits", "All endpoints unlocked", "Valid for 14 days"] },
  { id: "monthly", label: "1 Month", price: 5000, credits: "15,000 credits", popular: true, perks: ["15,000 API credits", "All endpoints unlocked", "Valid for 30 days"] },
  { id: "lifetime", label: "Lifetime", price: 10000, credits: "Unlimited", popular: false, perks: ["Unlimited API credits", "All endpoints unlocked", "Never expires", "Priority support"] },
];

const BANK = {
  name: "Praise Philip Jacob",
  number: "7074435901",
  bank: "Moniepoint MFB",
};

export default function Upgrade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<"plan" | "payment" | "upload" | "done">("plan");
  const [screenshot, setScreenshot] = useState<{ data: string; mime: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("tb_token") : null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setScreenshot({ data: base64, mime: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!token) { navigate("/login"); return; }
    if (!screenshot || !selectedPlan) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ plan: selectedPlan, screenshotData: screenshot.data, screenshotMime: screenshot.mime }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast({ title: "Submission failed", description: data.error ?? "Try again", variant: "destructive" });
        return;
      }
      setStep("done");
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Submission Received!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">Your payment screenshot has been submitted. Admin will review and approve within <strong>24 hours</strong>. You'll see the update in your dashboard.</p>
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard" className="flex-1"><Button className="w-full">Go to Dashboard</Button></Link>
          <Link href="/docs" className="flex-1"><Button variant="outline" className="w-full">Browse API</Button></Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => step === "plan" ? navigate("/dashboard") : setStep(step === "upload" ? "payment" : "plan")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold">Upgrade Plan</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step: Choose plan */}
        {step === "plan" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Choose a plan</h1>
              <p className="text-muted-foreground text-sm">All plans use the same API. Credits never expire (except 2-week and monthly time limits).</p>
            </div>
            <div className="grid gap-4">
              {PLANS.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={"text-left rounded-xl border p-5 transition-all " + (selectedPlan === plan.id ? "border-primary bg-primary/5" : "border-border/40 bg-card/30 hover:border-primary/40")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={"h-4 w-4 rounded-full border-2 " + (selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground")} />
                      <span className="font-semibold">{plan.label}</span>
                      {plan.popular && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Most Popular</Badge>}
                    </div>
                    <span className="font-mono font-bold text-primary">₦{plan.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{plan.credits}</p>
                  <ul className="space-y-1">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={10} className="text-primary shrink-0" /> {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <Button className="w-full h-11" disabled={!selectedPlan} onClick={() => setStep("payment")}>
              Continue with {selectedPlan ? PLANS.find((p) => p.id === selectedPlan)?.label : "plan"} →
            </Button>
          </div>
        )}

        {/* Step: Bank details */}
        {step === "payment" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Make Payment</h1>
              <p className="text-muted-foreground text-sm">Transfer to the account below, then upload your screenshot.</p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card/40 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-primary" />
                <h2 className="font-semibold">Bank Details</h2>
              </div>
              {[
                { label: "Account Name", value: BANK.name },
                { label: "Account Number", value: BANK.number },
                { label: "Bank", value: BANK.bank },
                { label: "Amount", value: "₦" + (PLANS.find((p) => p.id === selectedPlan)?.price ?? 0).toLocaleString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="font-mono font-semibold text-sm mt-0.5">{row.value}</p>
                  </div>
                  <button onClick={() => copyText(row.value, row.label)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    {copied === row.label ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-yellow-400 mb-1">Important</p>
              After transferring, come back here and upload your payment screenshot. Admin will verify and activate your plan within 24 hours.
            </div>

            <Button className="w-full h-11" onClick={() => setStep("upload")}>
              I've Made the Transfer — Upload Screenshot →
            </Button>
          </div>
        )}

        {/* Step: Upload screenshot */}
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Upload Screenshot</h1>
              <p className="text-muted-foreground text-sm">Upload a clear screenshot of your payment confirmation.</p>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className={"rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors " + (screenshot ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/30")}
            >
              {screenshot ? (
                <div className="space-y-2">
                  <CheckCircle2 size={32} className="text-green-400 mx-auto" />
                  <p className="font-medium text-sm">{screenshot.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); setScreenshot(null); }} className="text-xs text-red-400 flex items-center gap-1 mx-auto hover:underline">
                    <X size={10} /> Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP — max 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            <div className="rounded-lg border border-border/40 bg-card/30 p-4 text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Plan:</span> {PLANS.find((p) => p.id === selectedPlan)?.label}</p>
              <p><span className="text-foreground font-medium">Amount:</span> ₦{(PLANS.find((p) => p.id === selectedPlan)?.price ?? 0).toLocaleString()}</p>
              <p className="flex items-center gap-1"><Clock size={10} /><span>Review within 24 hours</span></p>
            </div>

            <Button className="w-full h-11" onClick={handleSubmit} disabled={!screenshot || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Submitting..." : "Submit Payment"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
