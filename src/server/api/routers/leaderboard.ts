import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { enrolledUsers, submissions } from "~/server/db/schema";

export const leaderboardRouter = createTRPCRouter({
  getLeaderboardData: protectedProcedure.query(async ({ ctx }) => {
    const [mentor] = await ctx.db
      .select()
      .from(enrolledUsers)
      .where(eq(enrolledUsers.userId, ctx.session.user.id));

    const submissionsData = await ctx.db.query.submissions.findMany({
      where: mentor?.mentorId ? eq(submissions.enrolledUserId, mentor.mentorId) : undefined,
      with: {
        points: true,
        attachment: {
          with: {
            class: {
              with: {
                course: {
                  columns: {
                    id: true,
                    title: true,
                    startDate: true,
                  },
                },
              },
            },
          },
        },
        enrolledUser: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay();
    const daysToLastSunday = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    const lastSunday = new Date(currentDate);
    lastSunday.setDate(currentDate.getDate() - daysToLastSunday);
    lastSunday.setHours(12, 0, 0, 0);

    const submissionsUptoLastSunday = submissionsData.filter(
      submission => submission.submissionDate < lastSunday
    );

    const submissionsWithPoints = submissionsUptoLastSunday.map(submission => ({
      ...submission,
      totalPoints: submission.points.reduce((acc, curr) => acc + (curr.score ?? 0), 0),
    }));

    const sortedSubmissions = submissionsWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    return { sortedSubmissions };
  }),
}); 