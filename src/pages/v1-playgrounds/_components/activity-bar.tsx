import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Files, Search, GitBranch, Bug, ExpandIcon } from "lucide-react";
import { Explorer } from "./explorer";
import { cn } from "@/lib/utils";

const activityItems = [
  {
    value: "explorer",
    icon: Files,
    content: Explorer,
  },
  {
    value: "search",
    icon: Search,
    content: () => <div className="w-64 h-full border-r border-[#333333] bg-[#252526] p-4">Search Content</div>,
  },
  {
    value: "source-control",
    icon: GitBranch,
    content: () => <div className="w-64 h-full border-r border-[#333333] bg-[#252526] p-4">Source Control Content</div>,
  },
  {
    value: "debug",
    icon: Bug,
    content: () => <div className="w-64 h-full border-r border-[#333333] bg-[#252526] p-4">Debug Content</div>,
  },
  {
    value: "extensions",
    icon: ExpandIcon,
    content: () => <div className="w-64 h-full border-r border-[#333333] bg-[#252526] p-4">Extensions Content</div>,
  },
];

export function ActivityBar() {
  return (
    <Tabs defaultValue="explorer" orientation="vertical" className="flex h-full">
      <TabsList className="flex h-full w-12 flex-col items-center justify-start gap-0 bg-[#333333] py-2 rounded-none border-r border-[#252526]">
        {activityItems.map((item) => (
          <ActivityBarItem
            key={item.value}
            value={item.value}
            icon={item.icon}
            className="w-12 h-12 rounded-none hover:bg-[#2a2d2e]"
          />
        ))}
      </TabsList>
      {activityItems.map((item) => (
        <TabsContent key={item.value} value={item.value} className="h-full m-0">
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