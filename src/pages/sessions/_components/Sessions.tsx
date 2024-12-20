import type { Account, Session } from "@prisma/client";
import { actions } from "astro:actions";
import { HardDrive, Laptop, Monitor, Smartphone, Tablet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { providers } from "@/lib/auth";
import { extractDeviceLabel } from "@/lib/device";

type SessionsModalProps = {
  sessions: Session[];
  accounts: Account[];
  currentSessionId?: string;
};

export default function Sessions({ sessions, accounts, currentSessionId }: SessionsModalProps) {
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await actions.users_deleteSession({ sessionId });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleConnect = (provider: string) => {
    const url = new URL(window.location.href);
    url.pathname = `/api/auth/signin/${provider}`;
    window.location.href = url.toString();
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <HardDrive className="h-5 w-5" />;

    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-5 w-5" />;
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-5 w-5" />;
    } else if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-6">
      <div className="bg-background rounded-xl shadow-lg p-6 border">
        <h2 className="text-2xl font-semibold mb-6">Account Settings</h2>

        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="connections">Connected Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4 mt-6">
            {sessions.map((session) => {
              const isCurrentSession = session.id === currentSessionId;
              const deviceInfo = extractDeviceLabel(session.userAgent || "");

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-muted rounded-lg border">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div>
                      <p className="font-medium">{deviceInfo}</p>
                      <p className="text-sm text-muted-foreground">
                        {isCurrentSession ? "Current session" : "Active session"}
                      </p>
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="connections" className="space-y-4 mt-6">
            {Object.entries(providers).map(([key, _]) => {
              if (key === "credentials") return null;
              const isConnected = accounts.some((account) => account.provider === key);

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-muted rounded-lg border">
                      <span className="text-lg font-semibold">{key === "google" ? "G" : "GH"}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-muted-foreground">
                        {isConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isConnected ? "destructive" : "default"}
                    size="sm"
                    onClick={() => !isConnected && handleConnect(key)}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
