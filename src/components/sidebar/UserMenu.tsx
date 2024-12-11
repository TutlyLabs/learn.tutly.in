import { User } from "@prisma/client";
import { useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { Bell, LogOut } from "lucide-react";

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
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center bg-muted hover:bg-muted/80 rounded-xl px-2 py-1 cursor-pointer w-16">
          <Avatar className="h-7 w-7 rounded-full cursor-pointer">
            <AvatarImage src={user.image ?? "/placeholder.jpg"} alt={user.name ?? user.username} />
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
      <DropdownMenuContent className="w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
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
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <a href="/profile">
            <DropdownMenuItem>Account</DropdownMenuItem>
          </a>
          <DropdownMenuItem>
            <Bell className="size-6" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <a href="/api/auth/signout">
          <DropdownMenuItem>
            <LogOut className="size-6" />
            Log out
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
