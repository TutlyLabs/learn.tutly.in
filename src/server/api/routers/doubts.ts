import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { doubts, responses } from "~/server/db/schema";

export const doubtsRouter = createTRPCRouter({
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.doubts.findMany({
        where: eq(doubts.courseId, input.courseId),
        with: {
          user: true,
          responses: {
            with: {
              user: true,
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [doubt] = await ctx.db
        .insert(doubts)
        .values({
          courseId: input.courseId,
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
        })
        .returning();

      return doubt;
    }),

  createResponse: protectedProcedure
    .input(
      z.object({
        doubtId: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [response] = await ctx.db
        .insert(responses)
        .values({
          doubtId: input.doubtId,
          userId: ctx.session.user.id,
          description: input.description,
        })
        .returning();

      return response;
    }),

  delete: protectedProcedure
    .input(z.object({ doubtId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(doubts)
        .where(
          and(
            eq(doubts.id, input.doubtId),
            eq(doubts.userId, ctx.session.user.id)
          )
        )
        .returning();

      return deleted;
    }),

  deleteResponse: protectedProcedure
    .input(z.object({ responseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(responses)
        .where(eq(responses.id, input.responseId))
        .returning();

      return deleted;
    }),
}); 