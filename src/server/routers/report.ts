import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

interface ReportData {
  username: string;
  name: string | null;
  submissionLength: number;
  assignmentLength: number;
  score: number;
  submissionEvaluatedLength: number;
  attendance: string;
  mentorUsername: string | null;
}

export const reportRouter = createTRPCRouter({
  generateReport: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user || ctx.user.role === "STUDENT") {
        throw new Error("You are not authorized to generate report");
      }

      const enrolledUsers = await ctx.db.enrolledUsers.findMany({
        where: {
          courseId: input.courseId,
          user: {
            role: "STUDENT",
            organizationId: ctx.user.organizationId,
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      let submissions = await ctx.db.submission.findMany({
        where: {
          enrolledUser: {
            courseId: input.courseId,
          },
        },
        select: {
          id: true,
          attachmentId: true,
          enrolledUser: {
            select: {
              username: true,
              user: {
                select: {
                  name: true,
                },
              },
              mentorUsername: true,
            },
          },
        },
      });

      if (ctx.user.role === "MENTOR") {
        submissions = submissions.filter(
          (submission) => submission.enrolledUser.mentorUsername === ctx.user.username
        );
      }

      const attendance = await ctx.db.attendance.findMany({
        where: {
          attended: true,
        },
        select: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      const groupedAttendance = attendance.reduce((acc: Record<string, number>, curr) => {
        const username = curr.user.username;
        acc[username] = (acc[username] ?? 0) + 1;
        return acc;
      }, {});

      const totalClasses = await ctx.db.class.count();

      const obj: Record<
        string,
        {
          username: string;
          name: string | null;
          submissions: Set<string>;
          submissionsLength: number;
          assignments: Set<string>;
          assignmentLength: number;
          mentorUsername: string | null;
          score?: number;
          submissionEvaluatedLength?: number;
          attendance?: number;
        }
      > = {};

      enrolledUsers.forEach((enrolledUser) => {
        obj[enrolledUser.username] = {
          username: enrolledUser.username,
          name: enrolledUser.user.name,
          submissions: new Set(),
          submissionsLength: 0,
          assignments: new Set(),
          assignmentLength: 0,
          mentorUsername: enrolledUser.mentorUsername,
        };
      });

      submissions.forEach((submission) => {
        const userObj = obj[submission.enrolledUser.username];
        if (userObj) {
          userObj.submissions.add(submission.id);
          userObj.submissionsLength++;
          if (submission.attachmentId) {
            userObj.assignments.add(submission.attachmentId);
          }
          userObj.assignmentLength = userObj.assignments.size;
          userObj.mentorUsername = submission.enrolledUser.mentorUsername;
        }
      });

      const points = await ctx.db.point.findMany({
        select: {
          score: true,
          submissions: {
            select: {
              id: true,
              enrolledUser: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      Object.values(obj).forEach((ob) => {
        try {
          const userPoints = points.filter((point) =>
            point.submissions ? point.submissions.enrolledUser.username === ob.username : false
          );
          ob.score = userPoints.reduce((acc, curr) => acc + (curr.score || 0), 0);
          ob.submissionEvaluatedLength = new Set(
            userPoints
              .map((point) => point.submissions?.id)
              .filter((id): id is string => id !== undefined)
          ).size;
        } catch (e) {
          console.log("Error while generating report : ", e);
        }
      });

      Object.values(obj).forEach((ob) => {
        if (!groupedAttendance[ob.username]) {
          groupedAttendance[ob.username] = 0;
        }
        ob.attendance = ((groupedAttendance[ob.username] ?? 0) * 100) / totalClasses;
      });

      let selectedFields: ReportData[] = Object.values(obj).map((ob) => ({
        username: ob.username,
        name: ob.name,
        submissionLength: ob.submissionsLength,
        assignmentLength: ob.assignmentLength,
        score: ob.score ?? 0,
        submissionEvaluatedLength: ob.submissionEvaluatedLength ?? 0,
        attendance: ob.attendance?.toFixed(2) ?? "0.00",
        mentorUsername: ob.mentorUsername ?? "",
      }));

      selectedFields.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      selectedFields.sort((a, b) => b.score - a.score);
      selectedFields.sort((a, b) => (a.mentorUsername ?? "").localeCompare(b.mentorUsername ?? ""));

      if (ctx.user.role === "MENTOR") {
        selectedFields = selectedFields.filter(
          (selectedField) => selectedField.mentorUsername === ctx.user.username
        );
      }

      return { success: true, data: selectedFields };
    }),
});
