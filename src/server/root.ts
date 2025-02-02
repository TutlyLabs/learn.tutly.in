import { coursesRouter } from "./routers/courses"
import { notesRouter } from "./routers/notes"
import { usersRouter } from "./routers/users"
import { createTRPCRouter } from "./trpc"
import { attachmentsRouter } from "./routers/attachments"
import { bookmarksRouter } from "./routers/bookmarks"
import { classesRouter } from "./routers/classes"
import { assignmentsRouter } from "./routers/assignments"

export const appRouter = createTRPCRouter({
  users: usersRouter,
  courses: coursesRouter,
  notes: notesRouter,
  attachments: attachmentsRouter,
  bookmarks: bookmarksRouter,
  classes: classesRouter,
  assignments: assignmentsRouter,
})

export type AppRouter = typeof appRouter