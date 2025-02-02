import { groupActions } from "@/lib/group";

import * as assignments from "./assignments";
import * as attachments from "./attachments";
import * as attendances from "./attendance";
import * as bookmarks from "./bookmarks";
import * as classes from "./classes";
import * as codingPlatforms from "./codingPlatforms";
import * as courses from "./courses";
import * as doubts from "./doubts";
import * as fileupload from "./fileupload";
import * as leaderboard from "./getLeaderboard";
import * as holidays from "./holidays";
import * as mentors from "./mentors";
import * as notes from "./notes";
// import * as resend from "./resend";
import * as notifications from "./notifications";
import * as points from "./points";
import * as report from "./report";
import * as resetPassword from "./reset-password";
import * as schedule from "./schedule";
import * as statistics from "./statistics";
import * as submissions from "./submission";
import * as users from "./users";

export const server = {
  ...groupActions("assignments", assignments, "_"),
  ...groupActions("attendances", attendances, "_"),
  ...groupActions("attachments", attachments, "_"),
  ...groupActions("bookmarks", bookmarks, "_"),
  ...groupActions("classes", classes, "_"),
  ...groupActions("codingPlatforms", codingPlatforms, "_"),
  ...groupActions("courses", courses, "_"),
  ...groupActions("doubts", doubts, "_"),
  ...groupActions("fileupload", fileupload, "_"),
  ...groupActions("holidays", holidays, "_"),
  ...groupActions("leaderboard", leaderboard, "_"),
  ...groupActions("mentors", mentors, "_"),
  ...groupActions("notes", notes, "_"),
  ...groupActions("notifications", notifications, "_"),
  ...groupActions("points", points, "_"),
  ...groupActions("report", report, "_"),
  ...groupActions("reset_password", resetPassword, "_"),
  ...groupActions("schedule", schedule, "_"),
  ...groupActions("statistics", statistics, "_"),
  ...groupActions("submissions", submissions, "_"),
  ...groupActions("users", users, "_"),
};
