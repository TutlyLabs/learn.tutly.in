import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { SessionUser } from "@/lib/auth/session";

import { ModeToggle } from "../ModeToggle";
import Notifications from "../Notifications";
import { DynamicBreadcrumbs } from "./DynamicBreadcrumbs";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  user: SessionUser;
  pathname: string;
  crumbReplacement?: { [key: string]: string };
}

export function AppHeader({ user, pathname, crumbReplacement = {} }: AppHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-1 sm:gap-2 border-b px-2 sm:px-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1 sm:gap-2 pl-4 sm:pl-0">
          {isMobile && <Separator orientation="vertical" className="h-4 ml-3 sm:ml-5" />}
          <DynamicBreadcrumbs pathname={pathname} crumbReplacement={crumbReplacement} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="max-sm:hidden text-md font-medium">{user.role}</span>
          <ModeToggle />
          <Notifications user={user} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
