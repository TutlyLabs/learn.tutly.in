import { groupActions } from "@/lib/group";

import * as aiQuery from "./aiQuery";
import * as assignments from "./assignments";
import * as attachments from "./attachments";
import * as attendances from "./attendance";
import * as bookmarks from "./bookmarks";
import * as classes from "./classes";
import * as codingPlatforms from "./codingPlatforms";
import * as courses from "./courses";
import * as doubts from "./doubts";
import * as fileupload from "./fileupload";
import * as folders from "./folders";
import * as gemini from "./gemini";
import * as leaderboard from "./getLeaderboard";
import * as holidays from "./holidays";
import * as mentors from "./mentors";
import * as notes from "./notes";
// import * as resend from "./resend";
import * as notifications from "./notifications";
import * as oauth from "./oauth";
import * as points from "./points";
import * as report from "./report";
import * as resetPassword from "./reset-password";
import * as sandbox from "./sandbox";
import * as schedule from "./schedule";
import * as statistics from "./statistics";
import * as submissions from "./submission";
import * as users from "./users";

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
  ...groupActions("schedule", schedule, "_"),
  ...groupActions("codingPlatforms", codingPlatforms, "_"),
  ...groupActions("holidays", holidays, "_"),
  ...groupActions("reset_password", resetPassword, "_"),
  ...groupActions("folders", folders, "_"),
  ...groupActions("sandbox", sandbox, "_"),
  ...groupActions("gemini", gemini, "_"),
  ...groupActions("oauth", oauth, "_"),
  ...groupActions("aiQuery", aiQuery, "_"),
};
