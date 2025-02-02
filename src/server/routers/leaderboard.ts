import type { Course, User, submission } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "../trpc";

interface LeaderboardSubmission extends Partial<submission> {
  totalPoints: number;
  enrolledUser: {
    user: Pick<User, "id" | "name" | "username" | "image">;
  };
  assignment?: {
    class?: {
      course?: Pick<Course, "id" | "title" | "startDate"> | null;
    } | null;
  };
}

export const leaderboardRouter = createTRPCRouter({
  getLeaderboardData: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = ctx.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }

      const mentor = await ctx.db.enrolledUsers.findMany({
        where: {
          username: currentUser.username,
          user: {
            organizationId: currentUser.organizationId,
          },
        },
        select: {
          mentorUsername: true,
        },
      });

      const submissions = await ctx.db.submission.findMany({
        where: {
          enrolledUser: {
            // TODO: Fix this to not use mentor[0]
            mentorUsername: mentor[0]?.mentorUsername ?? null,
          },
        },
        select: {
          id: true,
          points: true,
          assignment: {
            select: {
              class: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                      startDate: true,
                    },
                  },
                },
              },
            },
          },
          submissionDate: true,
          enrolledUser: {
            select: {
              user: {
                select: {
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

      const submissionsUptoLastSunday = submissions.filter((submission) => {
        const submissionDate = new Date(submission.submissionDate);
        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay();
        const daysToLastSunday = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
        const lastSunday = new Date(currentDate);
        lastSunday.setDate(currentDate.getDate() - daysToLastSunday);
        lastSunday.setHours(12, 0, 0, 0);
        return submissionDate < lastSunday;
      });

      const totalPoints: LeaderboardSubmission[] = submissionsUptoLastSunday.map((submission) => {
        const totalPoints = submission.points.reduce(
          (acc: number, curr: { score: number | null }) => acc + (curr.score ?? 0),
          0
        );
        return {
          id: submission.id,
          totalPoints,
          submissionDate: submission.submissionDate,
          enrolledUser: submission.enrolledUser,
          assignment: submission.assignment,
        };
      });

      const sortedSubmissions = totalPoints.sort((a, b) => b.totalPoints - a.totalPoints);

      return { success: true, data: { sortedSubmissions, currentUser } };
    } catch (error) {
      console.error("Error in getLeaderboardData:", error);
      return { error: "Failed to get leaderboard data" };
    }
  }),

  getLeaderboardDataForStudent: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) return { error: "Unauthorized" };

    const leaderboardData = await ctx.db.submission.findMany({
      where: {
        enrolledUser: {
          user: {
            id: currentUser.id,
          },
        },
      },
      include: {
        points: true,
      },
    });

    const totalPoints = leaderboardData.reduce((total, submission) => {
      const submissionPoints = submission.points.reduce((acc, curr) => acc + (curr.score ?? 0), 0);
      return total + submissionPoints;
    }, 0);

    return { success: true, data: totalPoints };
  }),

  getSubmissionsCountOfAllStudents: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = ctx.user;
      if (!currentUser) return { error: "Unauthorized" };

      const submissions = await ctx.db.submission.findMany({
        select: {
          enrolledUser: {
            select: {
              username: true,
            },
          },
          points: true,
        },
        where: {
          points: {
            some: {
              score: {
                gt: 0,
              },
            },
          },
        },
      });

      const groupedSubmissions = submissions.reduce((acc: Record<string, number>, curr) => {
        const username = curr.enrolledUser.username;
        acc[username] = (acc[username] ?? 0) + 1;
        return acc;
      }, {});

      return { success: true, data: groupedSubmissions };
    } catch (error) {
      console.error("Error in getSubmissionsCountOfAllStudents:", error);
      return { error: "Failed to get submissions count" };
    }
  }),

  getMentorLeaderboardData: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = ctx.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }

      const submissions = await ctx.db.submission.findMany({
        where: {
          enrolledUser: {
            mentorUsername: currentUser.username,
          },
        },
        select: {
          id: true,
          points: true,
          assignment: {
            select: {
              class: {
                select: {
                  course: {
                    select: {
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
            select: {
              user: {
                select: {
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

      const totalPoints = submissions.map((submission) => {
        const totalPoints = submission.points.reduce(
          (acc: number, curr: { score: number | null }) => acc + (curr.score ?? 0),
          0
        );
        return { ...submission, totalPoints, rank: 0 };
      });

      const sortedSubmissions = totalPoints.sort((a, b) => b.totalPoints - a.totalPoints);

      sortedSubmissions.forEach((submission, index) => {
        submission.rank = index + 1;
      });

      return { success: true, data: { sortedSubmissions, currentUser } };
    } catch (error) {
      console.error("Error in getMentorLeaderboardData:", error);
      return { error: "Failed to get mentor leaderboard data" };
    }
  }),

  getMentorLeaderboardDataForDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = ctx.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }

      const submissions = await ctx.db.submission.findMany({
        where: {
          enrolledUser: {
            mentorUsername: currentUser.username,
          },
        },
        include: {
          points: true,
        },
      });

      const filteredSubmissions = submissions.filter((submission) => submission.points.length > 0);

      return { success: true, data: filteredSubmissions.length };
    } catch (error) {
      console.error("Error in getMentorLeaderboardDataForDashboard:", error);
      return { error: "Failed to get mentor dashboard data" };
    }
  }),

  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) return { error: "Unauthorized" };

    const leaderboardData = await ctx.db.submission.findMany({
      where: {
        enrolledUser: {
          user: {
            id: currentUser.id,
          },
        },
      },
      include: {
        points: true,
      },
    });

    const totalPoints = leaderboardData.reduce((total, submission) => {
      const submissionPoints = submission.points.reduce(
        (acc: number, curr: { score: number | null }) => acc + (curr.score ?? 0),
        0
      );
      return total + submissionPoints;
    }, 0);

    return { success: true, data: totalPoints };
  }),
});
