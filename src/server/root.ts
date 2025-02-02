import { assignmentsRouter } from "./routers/assignments";
import { attachmentsRouter } from "./routers/attachments";
import { attendanceRouter } from "./routers/attendance";
import { bookmarksRouter } from "./routers/bookmarks";
import { classesRouter } from "./routers/classes";
import { codingPlatformsRouter } from "./routers/codingPlatforms";
import { coursesRouter } from "./routers/courses";
import { doubtsRouter } from "./routers/doubts";
import { fileUploadRouter } from "./routers/fileupload";
import { holidaysRouter } from "./routers/holidays";
import { leaderboardRouter } from "./routers/leaderboard";
import { mentorsRouter } from "./routers/mentors";
import { notesRouter } from "./routers/notes";
import { notificationsRouter } from "./routers/notifications";
// import { resendRouter } from "./routers/resend"
import { pointsRouter } from "./routers/points";
import { profileRouter } from "./routers/profile";
import { reportRouter } from "./routers/report";
import { resetPasswordRouter } from "./routers/reset-password";
import { scheduleRouter } from "./routers/schedule";
import { statisticsRouter } from "./routers/statistics";
import { submissionRouter } from "./routers/submission";
import { usersRouter } from "./routers/users";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  assignments: assignmentsRouter,
  attachments: attachmentsRouter,
  attendance: attendanceRouter,
  bookmarks: bookmarksRouter,
  classes: classesRouter,
  codingPlatforms: codingPlatformsRouter,
  courses: coursesRouter,
  doubts: doubtsRouter,
  fileUpload: fileUploadRouter,
  holidays: holidaysRouter,
  leaderboard: leaderboardRouter,
  mentors: mentorsRouter,
  notes: notesRouter,
  notifications: notificationsRouter,
  // resend: resendRouter,
  points: pointsRouter,
  resetPassword: resetPasswordRouter,
  schedule: scheduleRouter,
  statistics: statisticsRouter,
  submission: submissionRouter,
  report: reportRouter,
  users: usersRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
