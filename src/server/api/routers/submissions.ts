import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { submissions } from "~/server/db/schema";

export const submissionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      enrolledUserId: z.string(),
      attachmentId: z.string(),
      data: z.record(z.any()).optional(),
      submissionLink: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [submission] = await ctx.db.insert(submissions).values({
        enrolledUserId: input.enrolledUserId,
        attachmentId: input.attachmentId,
        data: input.data ? JSON.stringify(input.data) : undefined,
        submissionLink: input.submissionLink,
      }).returning();

      return submission;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.record(z.any()).optional(),
      submissionLink: z.string().optional(),
      overallFeedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(submissions)
        .set({
          data: input.data ? JSON.stringify(input.data) : undefined,
          submissionLink: input.submissionLink,
          overallFeedback: input.overallFeedback,
        })
        .where(eq(submissions.id, input.id))
        .returning();

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const submission = await ctx.db.query.submissions.findFirst({
        where: eq(submissions.id, input.id),
        with: {
          points: true,
          enrolledUser: {
            with: {
              user: true,
            },
          },
        },
      });

      return submission;
    }),
}); 