import { Role } from "@prisma/client";
import {
  BarChart,
  Bookmark,
  Brain,
  Calendar,
  ClipboardList,
  GraduationCap,
  HardDrive,
  Home,
  Plug,
  Terminal,
  Users,
  Users2,
} from "lucide-react";

import type { SidebarItem } from "@/components/sidebar/AppSidebar";

const InstructorItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: Calendar,
  },
  {
    title: "Learning",
    url: "#",
    icon: GraduationCap,
    items: [
      {
        title: "Courses",
        url: "/courses",
      },
      {
        title: "Notes",
        url: "/notes",
      },
    ],
  },
  {
    title: "Assessment",
    url: "#",
    icon: ClipboardList,
    items: [
      {
        title: "Assignments",
        url: "/tutor/assignments",
      },
      {
        title: "Leaderboard",
        url: "/tutor/leaderboard",
      },
      {
        title: "Attendance",
        url: "/tutor/attendance",
      },
    ],
  },
  {
    title: "Analytics",
    url: "#",
    icon: BarChart,
    items: [
      {
        title: "Statistics",
        url: "/tutor/statistics",
      },
      {
        title: "Report",
        url: "/tutor/report",
      },
    ],
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Management",
    url: "#",
    icon: Users2,
    items: [
      {
        title: "Activity",
        url: "/tutor/activity",
      },
      {
        title: "Manage",
        url: "/tutor/manage-users",
      },
    ],
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Playgrounds",
    url: "/playgrounds",
    icon: Terminal,
  },
  {
    title: "Drive",
    url: "/drive",
    icon: HardDrive,
  },
];

const AdminItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: Calendar,
  },
  {
    title: "Learning",
    url: "#",
    icon: GraduationCap,
    items: [
      {
        title: "Courses",
        url: "/courses",
      },
      {
        title: "Notes",
        url: "/notes",
      },
    ],
  },
  {
    title: "Assessment",
    url: "#",
    icon: ClipboardList,
    items: [
      {
        title: "Assignments",
        url: "/tutor/assignments",
      },
      {
        title: "Leaderboard",
        url: "/tutor/leaderboard",
      },
      {
        title: "Attendance",
        url: "/tutor/attendance",
      },
    ],
  },
  {
    title: "Analytics",
    url: "#",
    icon: BarChart,
    items: [
      {
        title: "Statistics",
        url: "/tutor/statistics",
      },
      {
        title: "Report",
        url: "/tutor/report",
      },
    ],
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Management",
    url: "#",
    icon: Users2,
    items: [
      {
        title: "Activity",
        url: "/tutor/activity",
      },
      {
        title: "Manage",
        url: "/tutor/manage-users",
      },
    ],
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Playgrounds",
    url: "/playgrounds",
    icon: Terminal,
  },
  {
    title: "Drive",
    url: "/drive",
    icon: HardDrive,
  },
];

const MentorItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: Calendar,
  },
  {
    title: "Learning",
    url: "#",
    icon: GraduationCap,
    items: [
      {
        title: "Courses",
        url: "/courses",
      },
      {
        title: "Notes",
        url: "/notes",
      },
    ],
  },
  {
    title: "Assessment",
    url: "#",
    icon: ClipboardList,
    items: [
      {
        title: "Assignments",
        url: "/tutor/assignments",
      },
      {
        title: "Leaderboard",
        url: "/tutor/leaderboard",
      },
      {
        title: "Attendance",
        url: "/tutor/attendance",
      },
    ],
  },
  {
    title: "Analytics",
    url: "#",
    icon: BarChart,
    items: [
      {
        title: "Statistics",
        url: "/tutor/statistics",
      },
      {
        title: "Report",
        url: "/tutor/report",
      },
    ],
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Management",
    url: "#",
    icon: Users2,
    items: [
      {
        title: "Activity",
        url: "/tutor/activity",
      },
      {
        title: "Manage",
        url: "/tutor/manage-users",
      },
    ],
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Playgrounds",
    url: "/playgrounds",
    icon: Terminal,
  },
  {
    title: "Drive",
    url: "/drive",
    icon: HardDrive,
  },
];

const StudentItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: Calendar,
  },
  {
    title: "Learning",
    url: "#",
    icon: GraduationCap,
    items: [
      {
        title: "Courses",
        url: "/courses",
      },
      {
        title: "Notes",
        url: "/notes",
      },
    ],
  },
  {
    title: "Assessment",
    url: "#",
    icon: ClipboardList,
    items: [
      {
        title: "Assignments",
        url: "/assignments",
      },
      {
        title: "Leaderboard",
        url: "/leaderboard",
      },
    ],
  },
  {
    title: "Analytics",
    url: "#",
    icon: BarChart,
    items: [
      {
        title: "Statistics",
        url: "/statistics",
      },
    ],
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Playgrounds",
    url: "/playgrounds",
    icon: Terminal,
  },
  {
    title: "Drive",
    url: "/drive",
    icon: HardDrive,
  },
];

export function getDefaultSidebarItems({
  role,
  isAdmin = false,
  isIntegrationsEnabled = false,
  isAIAssistantEnabled = false,
}: {
  role: Role;
  isAdmin?: boolean;
  isIntegrationsEnabled?: boolean;
  isAIAssistantEnabled?: boolean;
}): SidebarItem[] {
  let items: SidebarItem[] = [];
  if (role === "INSTRUCTOR") {
    if (isAdmin) {
      items = AdminItems as SidebarItem[];
    } else {
      items = InstructorItems as SidebarItem[];
    }
  } else if (role === "MENTOR") {
    items = MentorItems as SidebarItem[];
  } else if (role === "STUDENT") {
    items = StudentItems as SidebarItem[];
  } else {
    items = [];
  }
  if (isIntegrationsEnabled) {
    items = [
      ...items,
      {
        title: "Integrations",
        url: "/integrations",
        icon: Plug,
      },
    ];
  }
  if (isAIAssistantEnabled) {
    items = [
      ...items,
      {
        title: "AI Assistant",
        url: "/ai",
        icon: Brain,
      },
    ];
  }
  return items;
}
