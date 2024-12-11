import { Role } from "@prisma/client";
import {
  BarChart,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  Home,
  Terminal,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

import type { SidebarItem } from "@/components/sidebar/SidebarComponent";

const InstructorItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Assignments",
    url: "/instructor/assignments",
    icon: ClipboardList,
  },
  {
    title: "Leaderboard",
    url: "/instructor/leaderboard",
    icon: Trophy,
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Attendance",
    url: "/instructor/attendance",
    icon: UserCheck,
  },
  {
    title: "Statistics",
    url: "/instructor/statistics",
    icon: BarChart,
  },
  {
    title: "Report",
    url: "/instructor/report",
    icon: FileBarChart,
  },
];

const MentorItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Assignments",
    url: "/mentor/assignments",
    icon: ClipboardList,
  },
  {
    title: "Leaderboard",
    url: "/mentor/leaderboard",
    icon: Trophy,
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Attendance",
    url: "/mentor/attendance",
    icon: UserCheck,
  },
  {
    title: "Statistics",
    url: "/mentor/statistics",
    icon: BarChart,
  },
  {
    title: "Report",
    url: "/mentor/report",
    icon: FileBarChart,
  },
];

const StudentItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Assignments",
    url: "/assignments",
    icon: ClipboardList,
  },
  {
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Playgrounds",
    url: "/playgrounds",
    icon: Terminal,
  },
  {
    title: "Statistics",
    url: "/statistics",
    icon: BarChart,
  },
];

export function getDefaultSidebarItems(role: Role): SidebarItem[] {
  switch (role) {
    case "INSTRUCTOR":
      return InstructorItems;
    case "MENTOR":
      return MentorItems;
    case "STUDENT":
      return StudentItems;
    default:
      return [];
  }
}
