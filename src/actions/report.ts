import { Role } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

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

export const generateReport = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;

    if (!currentUser || currentUser.role === "STUDENT") {
      return { error: "You are not authorized to generate report" };
    }

    const whereClause =
      courseId === "all"
        ? {
            user: {
              role: Role.STUDENT,
              organizationId: currentUser.organizationId,
            },
          }
        : {
            courseId: courseId,
            user: {
              role: Role.STUDENT,
              organizationId: currentUser.organizationId,
            },
          };

    const enrolledUsers = await db.enrolledUsers.findMany({
      where: {
        ...whereClause,
        course: {
          enrolledUsers: {
            some: {
              username: currentUser.username,
            },
          },
        },
      },
      include: {
        user: true,
      },
    });

    let submissionsWhereClause =
      courseId === "all"
        ? {
            enrolledUser: {
              user: {
                organizationId: currentUser.organizationId,
                role: Role.STUDENT,
              },
            },
          }
        : {
            enrolledUser: {
              courseId: courseId,
              user: {
                role: Role.STUDENT,
              },
            },
          };

    let submissions = await db.submission.findMany({
      where: submissionsWhereClause,
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

    if (currentUser.role === "MENTOR") {
      submissions = submissions.filter(
        (submission) => submission.enrolledUser.mentorUsername === currentUser.username
      );
    }

    const attendance = await db.attendance.findMany({
      where: {
        attended: true,
        class:
          courseId === "all"
            ? {
                course: {
                  enrolledUsers: {
                    some: {
                      user: {
                        organizationId: currentUser.organizationId,
                        role: Role.STUDENT,
                      },
                    },
                  },
                },
              }
            : {
                courseId: courseId,
              },
      },
      select: {
        user: {
          select: {
            username: true,
          },
        },
        class: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const groupedAttendance = attendance.reduce((acc: Record<string, number>, curr) => {
      const username = curr.user.username;
      acc[username] = (acc[username] ?? 0) + 1;
      return acc;
    }, {});

    const totalClasses = await db.class.count({
      where:
        courseId === "all"
          ? {
              course: {
                enrolledUsers: {
                  some: {
                    user: {
                      organizationId: currentUser.organizationId,
                      role: Role.STUDENT,
                    },
                  },
                },
              },
            }
          : {
              courseId: courseId,
            },
    });

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
      if (enrolledUser.user) {
        obj[enrolledUser.username] = {
          username: enrolledUser.username,
          name: enrolledUser.user.name,
          submissions: new Set(),
          submissionsLength: 0,
          assignments: new Set(),
          assignmentLength: 0,
          mentorUsername: enrolledUser.mentorUsername,
        };
      }
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

    const points = await db.point.findMany({
      where: {
        submissions: {
          enrolledUser:
            courseId === "all"
              ? {
                  user: {
                    organizationId: currentUser.organizationId,
                    role: Role.STUDENT,
                  },
                }
              : {
                  courseId: courseId,
                },
        },
      },
      select: {
        score: true,
        submissions: {
          select: {
            id: true,
            enrolledUser: {
              select: {
                username: true,
                courseId: true,
              },
            },
          },
        },
      },
    });

    Object.values(obj).forEach((ob) => {
      try {
        const userPoints = points.filter(
          (point) => point.submissions?.enrolledUser.username === ob.username
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
      if (courseId === "all") {
        const userAttendance = attendance.filter((a) => a.user.username === ob.username).length;
        const totalClassesForUser = totalClasses;
        ob.attendance = totalClassesForUser > 0 ? (userAttendance * 100) / totalClassesForUser : 0;
      } else {
        ob.attendance = ((groupedAttendance[ob.username] ?? 0) * 100) / totalClasses;
      }
    });

    let SelectedFields: ReportData[] = Object.values(obj).map((ob) => ({
      username: ob.username,
      name: ob.name,
      submissionLength: ob.submissionsLength,
      assignmentLength: ob.assignmentLength,
      score: ob.score ?? 0,
      submissionEvaluatedLength: ob.submissionEvaluatedLength ?? 0,
      attendance: typeof ob.attendance === "number" ? ob.attendance.toFixed(2) : "0.00",
      mentorUsername: ob.mentorUsername ?? "",
    }));

    SelectedFields.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    SelectedFields.sort((a, b) => b.score - a.score);
    SelectedFields.sort((a, b) => (a.mentorUsername ?? "").localeCompare(b.mentorUsername ?? ""));

    if (currentUser.role === "MENTOR") {
      SelectedFields = SelectedFields.filter(
        (selectedField) => selectedField.mentorUsername === currentUser.username
      );
    }

    return { success: true, data: SelectedFields };
  },
});
