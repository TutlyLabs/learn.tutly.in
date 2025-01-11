import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { submissions, points, enrolledUsers } from "~/server/db/schema";

export const statisticsRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const totalSubmissions = await ctx.db.query.submissions.findMany({
      where: eq(submissions.enrolledUserId, ctx.session.user.id),
    });

    const evaluatedSubmissions = await ctx.db.query.submissions.findMany({
      where: eq(submissions.enrolledUserId, ctx.session.user.id),
      with: {
        points: true,
      },
    });

    const totalPoints = evaluatedSubmissions.reduce((acc, submission) => {
      return acc + submission.points.reduce((sum, point) => sum + (point.score ?? 0), 0);
    }, 0);

    const averagePoints = evaluatedSubmissions.length > 0
      ? totalPoints / evaluatedSubmissions.length
      : 0;

    return {
      totalSubmissions: totalSubmissions.length,
      evaluatedSubmissions: evaluatedSubmissions.filter(s => s.points.length > 0).length,
      totalPoints,
      averagePoints,
    };
  }),
}); 