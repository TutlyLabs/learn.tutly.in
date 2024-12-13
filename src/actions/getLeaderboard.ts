import type { Course, User, submission } from "@prisma/client";
import { defineAction } from "astro:actions";

import db from "@/lib/db";

import { getEnrolledCourses } from "./courses";

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

export const getLeaderboardData = defineAction({
  async handler(_, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }
      console.log(currentUser, "*******");
      const mentor = await db.enrolledUsers.findMany({
        where: {
          username: "22072A05E3",
        },
        select: {
          mentorUsername: true,
        },
      });

      const submissions = await db.submission.findMany({
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
      console.log(submissions);
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
  },
});

export const getLeaderboardDataForStudent = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const leaderboardData = await getLeaderboardData.call(undefined, { locals });
    if (!leaderboardData.data?.success) return { error: "Failed to get leaderboard data" };

    const totalPoints = leaderboardData.data?.data?.sortedSubmissions
      .filter(
        (submission: LeaderboardSubmission) => submission.enrolledUser.user.id === currentUser.id
      )
      .reduce(
        (total: number, submission: LeaderboardSubmission) => total + submission.totalPoints,
        0
      );

    return { success: true, data: totalPoints };
  },
});

export const getInstructorLeaderboardData = defineAction({
  async handler() {
    try {
      const { data: enrolledCourses } = await getEnrolledCourses();
      if (!enrolledCourses) {
        return { error: "Failed to get enrolled courses" };
      }

      const submissions = await db.submission.findMany({
        where:{
          enrolledUser:{
            course:{
              id:{
                in: enrolledCourses?.data?.map((course: Course) => course.id) ?? []
              }
            }
          }
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
              mentor: {
                select: {
                  username: true,
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
        return { ...submission, totalPoints };
      });

      const sortedSubmissions = totalPoints.sort((a, b) => b.totalPoints - a.totalPoints);

      return { sortedSubmissions, enrolledCourses };
    } catch {
      return { error: "Failed to get instructor leaderboard data" };
    }
  },
});

export const getSubmissionsCountOfAllStudents = defineAction({
  async handler(_, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser) return { error: "Unauthorized" };

      const submissions = await db.submission.findMany({
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
  },
});

export const getMentorLeaderboardData = defineAction({
  async handler(_, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }

      const submissions = await db.submission.findMany({
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
  },
});

export const getMentorLeaderboardDataForDashboard = defineAction({
  async handler(_, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser) {
        return { error: "Unauthorized" };
      }

      const submissions = await db.submission.findMany({
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
  },
});

export const getDashboardData = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const { data: leaderboardData } = await getLeaderboardData.call(undefined, { locals });
    if (!leaderboardData?.success || !leaderboardData?.data)
      return { error: "Failed to get leaderboard data" };

    const { sortedSubmissions } = leaderboardData.data;

    const assignmentsSubmitted = sortedSubmissions.filter(
      (x: LeaderboardSubmission) => x.enrolledUser.user.id === currentUser.id
    ).length;

    return {
      success: true,
      data: {
        sortedSubmissions,
        assignmentsSubmitted,
        currentUser,
      },
    };
  },
});
