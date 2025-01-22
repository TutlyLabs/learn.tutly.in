import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { submissions, enrolledUsers } from "~/server/db/schema";

export const reportRouter = createTRPCRouter({
  getStudentReport: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const studentSubmissions = await ctx.db.query.submissions.findMany({
        where: eq(submissions.enrolledUserId, ctx.session.user.id),
        with: {
          points: true,
          attachment: {
            with: {
              class: {
                with: {
                  course: {
                    where: eq(enrolledUsers.courseId, input.courseId),
                  },
                },
              },
            },
          },
        },
      });

      const totalPoints = studentSubmissions.reduce((acc, submission) => {
        const submissionPoints = submission.points.reduce((sum, point) => sum + (point.score ?? 0), 0);
        return acc + submissionPoints;
      }, 0);

      const submissionsWithPoints = studentSubmissions.filter(sub => sub.points.length > 0);
      const averagePoints = submissionsWithPoints.length > 0
        ? totalPoints / submissionsWithPoints.length
        : 0;

      return {
        totalSubmissions: studentSubmissions.length,
        evaluatedSubmissions: submissionsWithPoints.length,
        totalPoints,
        averagePoints,
        submissions: studentSubmissions,
      };
    }),
}); 