import { assignmentsRouter } from "./routers/assignments";
import { attachmentsRouter } from "./routers/attachments";
import { attendanceRouter } from "./routers/attendance";
import { bookmarksRouter } from "./routers/bookmarks";
import { classesRouter } from "./routers/classes";
import { codingPlatformsRouter } from "./routers/codingPlatforms";
import { coursesRouter } from "./routers/courses";
import { doubtsRouter } from "./routers/doubts";
import { fileUploadRouter } from "./routers/fileupload";
import { leaderboardRouter } from "./routers/leaderboard";
import { mentorsRouter } from "./routers/mentors";
import { notesRouter } from "./routers/notes";
import { notificationsRouter } from "./routers/notifications";
import { pointsRouter } from "./routers/points";
import { reportRouter } from "./routers/report";
import { resendRouter } from "./routers/resend";
import { scheduleRouter } from "./routers/schedule";
import { statisticsRouter } from "./routers/statistics";
import { submissionsRouter } from "./routers/submissions";
import { usersRouter } from "./routers/users";
import { createCallerFactory, createTRPCRouter } from "./trpc";
import { foldersRouter } from "./routers/folders";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
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
  leaderboard: leaderboardRouter,
  mentors: mentorsRouter,
  notes: notesRouter,
  notifications: notificationsRouter,
  points: pointsRouter,
  report: reportRouter,
  resend: resendRouter,
  schedule: scheduleRouter,
  statistics: statisticsRouter,
  submissions: submissionsRouter,
  users: usersRouter,
  folders: foldersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
