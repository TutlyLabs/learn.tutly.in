import { Role, User } from "@prisma/client";
import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export interface SidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
  items?: SidebarItem[];
  isActive?: boolean;
  className?: string;
}

interface SidebarComponentProps {
  user: User & { role: Role };
  initialSideBarItems: SidebarItem[];
  className?: string;
  organizationName?: string;
  pathname: string;
}

export function SidebarComponent({
  user,
  initialSideBarItems,
  className = "",
  organizationName = "Tutly",
  pathname,
}: SidebarComponentProps) {
  return (
    <Sidebar collapsible="icon" className={`w-56 ${className}`}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mx-auto"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <img src="/logo-with-bg.png" alt="Logo" className="size-8 rounded-md" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{organizationName}</span>
                <span className="truncate text-xs">{user.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {initialSideBarItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive || pathname.startsWith(item.url)}
                  className={`group/collapsible ${item.className || ""}`}
                >
                  <SidebarMenuItem>
                    {item.items ? (
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={`${pathname === item.url ? "bg-blue-600 text-white" : ""} hover:bg-blue-500 text-white m-auto flex cursor-pointer items-center gap-4 rounded px-5 py-6 text-base`}
                        >
                          <ItemIcon className="size-6" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    ) : (
                      <a href={item.url}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={`${pathname === item.url ? "bg-blue-600 text-white" : ""} hover:bg-blue-500 text-white m-auto flex cursor-pointer items-center gap-4 rounded px-5 py-6 text-base`}
                        >
                          <ItemIcon className="size-6" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </a>
                    )}
                    {item.items && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`${pathname === subItem.url ? "bg-blue-600 text-white" : ""} hover:bg-blue-500 text-white m-auto flex cursor-pointer items-center gap-4 rounded px-5 py-6 text-base ${subItem.className || ""}`}
                              >
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
