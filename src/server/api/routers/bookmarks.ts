import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { bookmarks } from "~/server/db/schema";

export const bookmarksRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(
      z.object({
        category: z.enum(["ASSIGNMENT", "CLASS", "DOUBT", "NOTIFICATION"]),
        objectId: z.string(),
        causedObjects: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existingBookmark] = await ctx.db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.category, input.category),
            eq(bookmarks.objectId, input.objectId),
            eq(bookmarks.userId, ctx.session.user.id)
          )
        );

      if (existingBookmark) {
        await ctx.db
          .delete(bookmarks)
          .where(eq(bookmarks.id, existingBookmark.id));
      } else {
        await ctx.db.insert(bookmarks).values({
          category: input.category,
          objectId: input.objectId,
          userId: ctx.session.user.id,
          causedObjects: JSON.stringify(input.causedObjects ?? {}),
        });
      }

      return { success: true };
    }),
}); 