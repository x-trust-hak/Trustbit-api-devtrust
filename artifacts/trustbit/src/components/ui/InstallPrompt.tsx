import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    if (ios) {
      setIsIOS(true);
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setVisible(false);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
      <div className="bg-zinc-900 border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-lg">T</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install TrustbitAPI</p>
            {isIOS ? (
              <p className="text-xs text-zinc-400 mt-0.5">
                Tap <span className="text-primary">Share</span> then{" "}
                <span className="text-primary">"Add to Home Screen"</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-0.5">
                Add to your home screen for quick access
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 -mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-black text-sm font-semibold py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Download size={15} />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
