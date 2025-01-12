import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { eq } from "drizzle-orm"
import { folders } from "~/server/db/schema"

export const foldersRouter = createTRPCRouter({
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.folders.findMany({
        where: eq(folders.courseId, input.courseId),
      })
    }),
}) 