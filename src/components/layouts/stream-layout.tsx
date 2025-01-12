"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chat } from "@/components/chat";
import { ParticipantsList } from "@/components/participants-list";

interface StreamLayoutProps {
  children: React.ReactNode;
  chat?: boolean;
  participants?: boolean;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  activeTab?: "chat" | "participants";
  onTabChange?: (tab: "chat" | "participants") => void;
}

export function StreamLayout({
  children,
  chat = true,
  participants = true,
  sidebarOpen = false,
  onSidebarOpenChange,
  activeTab = "chat",
  onTabChange
}: StreamLayoutProps) {
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<"chat" | "participants">("chat");

  const isOpen = onSidebarOpenChange ? sidebarOpen : localSidebarOpen;
  const currentTab: "chat" | "participants" = onTabChange ? activeTab : localActiveTab;

  const setIsOpen = (open: boolean) => {
    if (onSidebarOpenChange) {
      onSidebarOpenChange(open);
    } else {
      setLocalSidebarOpen(open);
    }
  };

  const handleTabChange = (tab: "chat" | "participants") => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="h-screen flex">
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isOpen && "mr-[360px]"
        )}
      >
        {children}
      </main>

      {(chat || participants) && (
        <aside
          className={cn(
            "fixed right-0 top-0 h-full w-[360px] border-l border-border bg-background transition-transform duration-300 ease-in-out",
            !isOpen && "translate-x-full"
          )}
        >
          <Tabs
            value={currentTab}
            onValueChange={(value) => handleTabChange(value as "chat" | "participants")}
            className="h-full flex flex-col"
          >
            <TabsList className="justify-start px-4 pt-2">
              {chat && <TabsTrigger value="chat">Chat</TabsTrigger>}
              {participants && <TabsTrigger value="participants">People</TabsTrigger>}
            </TabsList>
            {chat && (
              <TabsContent value="chat" className="flex-1 m-0">
                <Chat />
              </TabsContent>
            )}
            {participants && (
              <TabsContent value="participants" className="flex-1 m-0">
                <ParticipantsList />
              </TabsContent>
            )}
          </Tabs>
        </aside>
      )}
    </div>
  );
} 