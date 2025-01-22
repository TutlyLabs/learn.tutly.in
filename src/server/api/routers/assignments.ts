import { z } from "zod";
import { createTRPCRouter, mentorProcedure, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { attachments, enrolledUsers, submissions } from "~/server/db/schema";

export const assignmentsRouter = createTRPCRouter({
  getAllAssignedAssignments: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.session.user;

    const enrolledCourses = await ctx.db.query.enrolledUsers.findMany({
      where: eq(enrolledUsers.userId, currentUser.id),
      with: {
        course: {
          with: {
            classes: {
              with: {
                attachments: {
                  where: eq(attachments.attachmentType, "ASSIGNMENT"),
                  with: {
                    submissions: {
                      where: eq(submissions.enrolledUserId, currentUser.id),
                      with: {
                        points: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return enrolledCourses;
  }),

  getAllAssignmentsForMentor: mentorProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.session.user;

    const mentorCourses = await ctx.db.query.enrolledUsers.findMany({
      where: eq(enrolledUsers.mentorId, currentUser.id),
      with: {
        course: {
          with: {
            classes: {
              with: {
                attachments: {
                  where: eq(attachments.attachmentType, "ASSIGNMENT"),
                  with: {
                    submissions: {
                      where: eq(submissions.enrolledUserId, currentUser.id),
                      with: {
                        points: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return mentorCourses;
  }),

  getMentorPieChartData: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      let assignmentSubmissions;
      let totalMentees;

      if (currentUser.role === "MENTOR") {
        assignmentSubmissions = await ctx.db.query.submissions.findMany({
          where: and(
            eq(submissions.enrolledUserId, currentUser.id),
            eq(attachments.courseId, input.courseId)
          ),
          with: {
            points: true,
          },
        });

        totalMentees = await ctx.db.query.enrolledUsers.findMany({
          where: and(
            eq(enrolledUsers.mentorId, currentUser.id),
            eq(enrolledUsers.courseId, input.courseId)
          ),
        });
      } else {
        assignmentSubmissions = await ctx.db.query.submissions.findMany({
          where: eq(attachments.courseId, input.courseId),
          with: {
            points: true,
          },
        });

        totalMentees = await ctx.db.query.enrolledUsers.findMany({
          where: eq(enrolledUsers.courseId, input.courseId),
        });
      }

      let assignmentsWithPoints = 0;
      let assignmentsWithoutPoints = 0;

      assignmentSubmissions.forEach((submission) => {
        if (submission.points.length > 0) {
          assignmentsWithPoints++;
        } else {
          assignmentsWithoutPoints++;
        }
      });

      const totalAssignments = await ctx.db.query.attachments.findMany({
        where: and(
          eq(attachments.attachmentType, "ASSIGNMENT"),
          eq(attachments.courseId, input.courseId)
        ),
      });

      const notSubmitted = 
        totalAssignments.length * totalMentees.length - 
        assignmentsWithPoints - 
        assignmentsWithoutPoints;

      return [assignmentsWithPoints, assignmentsWithoutPoints, notSubmitted];
    }),
}); 