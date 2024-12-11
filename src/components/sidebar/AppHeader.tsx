import { User } from "@prisma/client";

import { ModeToggle } from "../ModeToggle";
import Notifications from "../Notifications";
import { UserMenu } from "./UserMenu";
import { DynamicBreadcrumbs } from "./DynamicBreadcrumbs";
import { Separator } from "../ui/separator";

interface AppHeaderProps {
  user: User;
  pathname: string;
  crumbReplacement?: { [key: string]: string };
}

export function AppHeader({ user, pathname, crumbReplacement = {} }: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumbs pathname={pathname} crumbReplacement={crumbReplacement} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-md font-medium">{user.role}</span>
          <ModeToggle />
          <Notifications user={user} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
