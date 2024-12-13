import { groupActions } from "@/lib/group";

import * as assignments from "./assignments";
import * as attachments from "./attachments";
import * as attendances from "./attendance";
import * as bookmarks from "./bookmarks";
import * as classes from "./classes";
import * as courses from "./courses";
import * as doubts from "./doubts";
import * as fileupload from "./fileupload";
import * as leaderboard from "./getLeaderboard";
import * as mentors from "./mentors";
import * as notes from "./notes";
// import * as resend from "./resend";
import * as notifications from "./notifications";
import * as points from "./points";
import * as report from "./report";
import * as submissions from "./submission";
import * as users from "./users";
import * as statistics from "./statistics";

export const server = {
  ...groupActions("courses", courses, "_"),
  ...groupActions("assignments", assignments, "_"),
  ...groupActions("attachments", attachments, "_"),
  ...groupActions("attendances", attendances, "_"),
  ...groupActions("classes", classes, "_"),
  ...groupActions("doubts", doubts, "_"),
  ...groupActions("leaderboard", leaderboard, "_"),
  ...groupActions("points", points, "_"),
  ...groupActions("submissions", submissions, "_"),
  ...groupActions("report", report, "_"),
  ...groupActions("mentors", mentors, "_"),
  ...groupActions("users", users, "_"),
  ...groupActions("notifications", notifications, "_"),
  ...groupActions("bookmarks", bookmarks, "_"),
  ...groupActions("notes", notes, "_"),
  ...groupActions("statistics", statistics, "_"),
  ...groupActions("fileupload", fileupload, "_"),
};
