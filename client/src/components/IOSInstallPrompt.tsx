import { useState, useEffect } from "react";
import { X, Share } from "lucide-react";

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("ios-install-prompt-dismissed");
    if (dismissed) {
      return;
    }

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      return;
    }

    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("ios-install-prompt-dismissed", "true");
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="bg-slate-800 text-white p-4 shadow-lg border-t-2 border-slate-700">
        <div className="container mx-auto flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Share className="w-5 h-5" />
              <h3 className="font-bold text-lg">Install FlexTab</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Install this app on your home screen for quick access and a better experience.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Tap</span>
              <Share className="w-4 h-4" />
              <span>then "Add to Home Screen"</span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
