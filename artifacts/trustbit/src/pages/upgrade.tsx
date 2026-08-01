import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  CreditCard, Upload, CheckCircle2, Clock, ArrowLeft, Loader2, X,
  Copy, Check, Zap, Calendar, Star, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  label: string;
  duration: string;
  credits: number;
  price: number;
  popular: boolean;
  benefits: string[];
}

interface BankInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export default function Upgrade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [bank, setBank] = useState<BankInfo>({ accountName: "", accountNumber: "", bankName: "" });
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"details" | "upload" | "done">("details");

  const [screenshot, setScreenshot] = useState<{ data: string; mime: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("tb_token") : null;

  useEffect(() => {
    fetch("/api/payment/plans")
      .then((r) => r.json())
      .then((d: { plans: Plan[]; bank: BankInfo }) => {
        if (d.plans?.length) setPlans(d.plans);
        if (d.bank?.accountName) setBank(d.bank);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const openModal = (plan: Plan) => {
    if (!token) { navigate("/login"); return; }
    setSelectedPlan(plan);
    setStep("details");
    setScreenshot(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setModalOpen(false);
  };

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
        body: JSON.stringify({ plan: selectedPlan.id, screenshotData: screenshot.data, screenshotMime: screenshot.mime }),
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

  const planIcons = [Calendar, Zap, Star];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/30 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <span className="font-semibold">Upgrade Plan</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield size={12} className="text-primary" />
            <span>Manual verification</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
            <Zap size={10} /> Simple, affordable plans
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Unlock full API access
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Choose a plan, pay via bank transfer, upload your receipt — we activate your credits within 24 hours.
          </p>
        </div>

        {/* Plan cards */}
        {loadingPlans ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl border border-border/40 bg-card/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan, i) => {
              const Icon = planIcons[i % planIcons.length];
              return (
                <div
                  key={plan.id}
                  className={"relative rounded-2xl border p-6 flex flex-col transition-all duration-200 " +
                    (plan.popular
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border/40 bg-card/30 hover:border-primary/40 hover:bg-card/50")}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground border-0 text-xs px-3 py-0.5 shadow-md">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className={"flex h-10 w-10 items-center justify-center rounded-xl mb-4 " +
                    (plan.popular ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground")}>
                    <Icon size={18} />
                  </div>

                  <h2 className="text-xl font-bold mb-0.5">{plan.label}</h2>
                  <p className="text-xs text-muted-foreground mb-4">{plan.duration}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-black font-mono text-primary">₦{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {plan.duration}</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={"w-full h-10 font-semibold " + (plan.popular ? "" : "variant-outline")}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => openModal(plan)}
                  >
                    Get {plan.label}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="mt-14 rounded-2xl border border-border/40 bg-card/20 p-6 md:p-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">How it works</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Pick a plan", desc: "Choose the plan that fits your usage needs." },
              { step: "02", title: "Pay & screenshot", desc: "Transfer to our account and capture the confirmation." },
              { step: "03", title: "Get activated", desc: "Upload the screenshot — credits activated within 24h." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="text-3xl font-black font-mono text-primary/20 leading-none">{s.step}</span>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full sm:max-w-md bg-background border border-border/50 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div>
                <h2 className="font-bold text-base">
                  {step === "done" ? "Payment Submitted!" : step === "upload" ? "Upload Screenshot" : `Pay for ${selectedPlan.label}`}
                </h2>
                {step !== "done" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step === "details" ? "Transfer to our account below" : "Upload your payment receipt"}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* STEP: Done */}
              {step === "done" && (
                <div className="flex flex-col items-center justify-center px-6 py-10 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Submission Received!</p>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                      Your screenshot is under review. Credits will be activated within <strong>24 hours</strong>.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full" onClick={closeModal}>Go to Dashboard</Button>
                    </Link>
                    <Button variant="outline" className="flex-1" onClick={closeModal}>Close</Button>
                  </div>
                </div>
              )}

              {/* STEP: Bank details */}
              {step === "details" && (
                <div className="p-5 space-y-4">
                  {/* Plan summary */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Selected plan</p>
                      <p className="font-bold">{selectedPlan.label} <span className="text-xs font-normal text-muted-foreground">({selectedPlan.duration})</span></p>
                    </div>
                    <p className="text-xl font-black font-mono text-primary">₦{selectedPlan.price.toLocaleString()}</p>
                  </div>

                  {/* Bank info */}
                  <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                      <CreditCard size={14} className="text-primary" />
                      <span className="text-sm font-semibold">Bank Details</span>
                    </div>
                    {[
                      { label: "Account Name", value: bank.accountName },
                      { label: "Account Number", value: bank.accountNumber },
                      { label: "Bank", value: bank.bankName },
                      { label: "Amount", value: `₦${selectedPlan.price.toLocaleString()}` },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-3 border-b border-border/10 last:border-0">
                        <div>
                          <p className="text-xs text-muted-foreground">{row.label}</p>
                          <p className="font-mono font-semibold text-sm mt-0.5">{row.value}</p>
                        </div>
                        <button
                          onClick={() => copyText(row.value, row.label)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border/40 hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copied === row.label ? <Check size={11} /> : <Copy size={11} />}
                          {copied === row.label ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-4 py-3 text-xs text-muted-foreground">
                    <p className="text-yellow-400 font-medium mb-0.5">After transferring</p>
                    Come back and upload your payment screenshot on the next step.
                  </div>

                  <Button className="w-full h-11" onClick={() => setStep("upload")}>
                    I've Transferred — Upload Screenshot →
                  </Button>
                </div>
              )}

              {/* STEP: Upload screenshot */}
              {step === "upload" && (
                <div className="p-5 space-y-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={"rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors " +
                      (screenshot ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/30")}
                  >
                    {screenshot ? (
                      <div className="space-y-2">
                        <CheckCircle2 size={32} className="text-green-400 mx-auto" />
                        <p className="font-medium text-sm">{screenshot.name}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                          className="text-xs text-red-400 flex items-center gap-1 mx-auto hover:underline"
                        >
                          <X size={10} /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={32} className="text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">Tap to upload payment screenshot</p>
                        <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP — max 5MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

                  <div className="rounded-lg border border-border/30 bg-card/20 px-4 py-3 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                    <div><p className="text-foreground/60">Plan</p><p className="font-medium text-foreground">{selectedPlan.label}</p></div>
                    <div><p className="text-foreground/60">Amount</p><p className="font-mono font-medium text-primary">₦{selectedPlan.price.toLocaleString()}</p></div>
                    <div className="col-span-2 flex items-center gap-1 mt-1 text-muted-foreground/70">
                      <Clock size={10} /> Review within 24 hours
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>← Back</Button>
                    <Button className="flex-1 h-11" onClick={handleSubmit} disabled={!screenshot || loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loading ? "Submitting..." : "Submit Payment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
