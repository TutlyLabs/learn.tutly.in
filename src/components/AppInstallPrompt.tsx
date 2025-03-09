import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppInstallPromptProps {
  showOnPageLoad?: boolean;
  className?: string;
}

const AppInstallPrompt = ({ showOnPageLoad = false, className = "" }: AppInstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showOpenInAppDialog, setShowOpenInAppDialog] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkStandalone = () => {
      const isInStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(isInStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      localStorage.setItem("appInstalled", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window
        .matchMedia("(display-mode: standalone)")
        .removeEventListener("change", checkStandalone);
    };
  }, []);

  useEffect(() => {
    if (showOnPageLoad && isMobile && !isStandalone && deferredPrompt) {
      const lastDashboardPromptTime = localStorage.getItem("lastDashboardPromptTime");
      const appInstalled = localStorage.getItem("appInstalled");
      const currentTime = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (
        (!lastDashboardPromptTime || currentTime - parseInt(lastDashboardPromptTime) > oneDay) &&
        !appInstalled
      ) {
        setShowPrompt(true);
        localStorage.setItem("lastDashboardPromptTime", currentTime.toString());
      }
    }
  }, [showOnPageLoad, isStandalone, deferredPrompt, isMobile]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      setShowOpenInAppDialog(true);
    }

    setShowPrompt(false);
  };

  const handleOpenInApp = () => {
    const appUrl = window.location.href;
    window.location.href = appUrl;
    setShowOpenInAppDialog(false);
  };

  if (isStandalone || !deferredPrompt) return null;

  return (
    <>
      {!showOnPageLoad && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrompt(true)}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      )}

      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Install Our App</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to install our app for a better experience? You can access all features
              offline and get a smoother experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Web</AlertDialogCancel>
            <AlertDialogAction onClick={handleInstallClick}>Install App</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showOpenInAppDialog} onOpenChange={setShowOpenInAppDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open in App</AlertDialogTitle>
            <AlertDialogDescription>
              The app has been installed successfully. Would you like to open it now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Web</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenInApp}>Open App</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export { AppInstallPrompt };
