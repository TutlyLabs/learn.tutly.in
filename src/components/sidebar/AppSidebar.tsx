import { User } from "@prisma/client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarComponent } from "./SidebarComponent";
import { getDefaultSidebarItems } from "@/config/sidebar";

interface AppSidebarProps {
  user: User;
  isSidebarOpen?: boolean;
  className?: string;
  pathname: string;
}

export function AppSidebar({ user, isSidebarOpen = true, className, pathname }: AppSidebarProps) {
  
const sidebarItems = getDefaultSidebarItems(user.role);

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <div className="relative">
        <SidebarComponent 
          user={user} 
          initialSideBarItems={sidebarItems} 
          className={className ?? ""} 
          pathname={pathname}
        />
        <SidebarTrigger className="-ml-2" />
      </div>
    </SidebarProvider>
  );
}
