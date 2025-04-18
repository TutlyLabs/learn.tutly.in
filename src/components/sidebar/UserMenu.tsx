import { Download, LockIcon, LogOut, UserIcon } from "lucide-react";
// import {  Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { FaCaretDown } from "react-icons/fa";

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
import { ToastAction } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { SessionUser } from "@/lib/auth/session";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface UserMenuProps {
  user: SessionUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();
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
    if (isMobile && !isStandalone && deferredPrompt) {
      const lastInstallPromptTime = localStorage.getItem("lastInstallPromptTime");
      const appInstalled = localStorage.getItem("appInstalled");
      const currentTime = new Date().getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (
        (!lastInstallPromptTime || currentTime - parseInt(lastInstallPromptTime) > oneWeek) &&
        !appInstalled
      ) {
        toast({
          title: "Install our app",
          description: "Install our app for a better experience!",
          action: (
            <ToastAction altText="Install app" onClick={handleInstallClick}>
              Install
            </ToastAction>
          ),
          duration: 10000,
        });
        localStorage.setItem("lastInstallPromptTime", currentTime.toString());
      }
    }
  }, [isStandalone, deferredPrompt, isMobile, toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isStandalone) {
        return;
      }

      toast({
        title: "Installation not supported",
        description:
          "Your browser doesn't support app installation or the app is already installed.",
        duration: 5000,
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      setShowOpenInAppDialog(true);
    }
  };

  const handleOpenInApp = () => {
    const appUrl = window.location.href;
    window.location.href = appUrl;
    setShowOpenInAppDialog(false);
  };

  return (
    <div className="relative">
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center bg-muted hover:bg-muted/80 rounded-xl px-2 py-1 cursor-pointer w-16">
            <Avatar className="h-7 w-7 rounded-full cursor-pointer">
              <AvatarImage
                src={user.image ?? "/placeholder.jpg"}
                alt={user.name ?? user.username}
              />
              <AvatarFallback className="rounded-full">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : user.username}
              </AvatarFallback>
            </Avatar>
            <div
              className="transition-transform duration-200 ml-1"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <FaCaretDown className="h-4 w-4" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg shadow-lg border border-border bg-background"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-7 w-7 rounded-full">
                <AvatarImage src={user.image ?? "/placeholder.jpg"} alt={user.name} />
                <AvatarFallback className="rounded-full">
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <a href="/profile">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <UserIcon className="h-5 w-5" />
                Profile
              </DropdownMenuItem>
            </a>
            <a href={`/change-password`}>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <LockIcon className="h-5 w-5" />
                Manage Password
              </DropdownMenuItem>
            </a>
            {/* {user.role === "STUDENT" && (
              <a href="/certificate">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <GrCertificate className="h-5 w-5" />
                  Certificate
                </DropdownMenuItem>
              </a>
            )} */}

            {/* <a href="/sessions">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-5 w-5" />
                Security Settings
              </DropdownMenuItem>
            </a> */}
            {/* <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Bell className="h-5 w-5" />
              Notifications
            </DropdownMenuItem> */}
            {!isStandalone && deferredPrompt && (
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={handleInstallClick}
              >
                <Download className="h-5 w-5" />
                Install App
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <a href="/api/auth/signout">
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600">
              <LogOut className="h-5 w-5" />
              Log out
            </DropdownMenuItem>
          </a>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>
  );
}
