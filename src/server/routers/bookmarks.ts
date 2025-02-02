import { BookMarkCategory } from "@prisma/client"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const bookmarksRouter = createTRPCRouter({
  toggleBookmark: protectedProcedure
    .input(z.object({
      category: z.nativeEnum(BookMarkCategory),
      objectId: z.string(),
      causedObjects: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingBookmark = await ctx.db.bookMarks.findFirst({
        where: {
          category: input.category,
          objectId: input.objectId,
          userId: ctx.user?.id!,
        },
      })

      if (existingBookmark) {
        await ctx.db.bookMarks.delete({
          where: {
            id: existingBookmark.id,
          },
        })
      } else {
        await ctx.db.bookMarks.create({
          data: {
            category: input.category,
            objectId: input.objectId,
            userId: ctx.user?.id!,
            causedObjects: input.causedObjects || {},
          },
        })
      }

      return { success: true }
    }),
  getBookmark: protectedProcedure
    .input(z.object({
      objectId: z.string(),
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.bookMarks.findFirst({
        where: {
          objectId: input.objectId,
          userId: input.userId
        }
      })
    }),
}) 