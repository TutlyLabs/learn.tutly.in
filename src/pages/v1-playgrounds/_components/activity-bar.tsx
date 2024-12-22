import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Files, Search, GitBranch, Bug, ExpandIcon, Settings } from "lucide-react";
import { Explorer } from "./explorer";
import { cn } from "@/lib/utils";
import type { VSCodeState } from "./state";

// First, define the sidebarItemMap
const sidebarItemMap = {
  "explorer": {
    name: "Explorer",
    icon: Files,
  },
  "search": {
    name: "Search",
    icon: Search,
  },
  "source-control": {
    name: "Source Control",
    icon: GitBranch,
  },
  "debug": {
    name: "Debug",
    icon: Bug,
  },
  "extensions": {
    name: "Extensions",
    icon: ExpandIcon,
  },
  "instructions": {
    name: "Instructions",
    icon: Files,
  },
  "settings": {
    name: "Settings",
    icon: Settings,
  }
} as const;

interface ActivityBarProps {
  config: VSCodeState["config"];
}

export function ActivityBar({ config }: ActivityBarProps) {
  const activityItems = config.statusBarItems.map((item: keyof typeof sidebarItemMap) => ({
    value: item,
    icon: sidebarItemMap[item].icon,
    content: item === "explorer" ? Explorer : 
            () => <div className="w-full h-full border-r border-[#333333] bg-[#252526] p-4">{sidebarItemMap[item].name} Content</div>
  }));

  return (
    <Tabs defaultValue="explorer" orientation="vertical" className="flex h-full p-0 m-0">
      <TabsList className="flex h-full w-12 flex-col items-center justify-start gap-0 bg-[#333333] pb-2 rounded-none border-r border-[#252526] p-0 m-0">
        {activityItems.map((item: any) => (
          <ActivityBarItem
            key={item.value}
            value={item.value}
            icon={item.icon}
            className="w-12 h-12 rounded-none hover:bg-[#2a2d2e] p-0 m-0"
          />
        ))}
      </TabsList>
      {activityItems.map((item: any) => (
        <TabsContent key={item.value} value={item.value} className="h-full w-full m-0 p-0">
          <item.content />
        </TabsContent>
      ))}
    </Tabs>
  );
}

import { TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

interface ActivityBarItemProps {
  value: string;
  icon: LucideIcon;
  className?: string;
}

export function ActivityBarItem({ value, icon: Icon, className }: ActivityBarItemProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "p-0 data-[state=active]:bg-[#252526] data-[state=active]:border-l-2 data-[state=active]:border-l-white rounded-none",
        "transition-colors duration-100",
        className
      )}
    >
      <Icon className="w-5 h-5 text-[#858585] data-[state=active]:text-white" />
    </TabsTrigger>
  );
} 