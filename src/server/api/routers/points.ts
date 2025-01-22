import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { points } from "~/server/db/schema";

export const pointsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      category: z.enum(["RESPOSIVENESS", "STYLING", "OTHER"]),
      feedback: z.string(),
      score: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [point] = await ctx.db
        .insert(points)
        .values({
          submissionId: input.submissionId,
          category: input.category,
          feedback: input.feedback,
          score: input.score,
        })
        .returning();

      return point;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      feedback: z.string(),
      score: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(points)
        .set({
          feedback: input.feedback,
          score: input.score,
        })
        .where(eq(points.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(points)
        .where(eq(points.id, input.id))
        .returning();

      return deleted;
    }),

  getBySubmissionId: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const submissionPoints = await ctx.db.query.points.findMany({
        where: eq(points.submissionId, input.submissionId),
      });

      return submissionPoints;
    }),
}); 