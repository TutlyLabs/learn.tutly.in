import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const getPiechartData = defineAction({
  input: z.object({
    courseId: z.string(),
    mentorUsername: z.any().optional(),
  }),
  handler: async ({ courseId, mentorUsername }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return null;
    }
    try {
      let assignments, noOfTotalMentees;
      if (currentUser.role === "MENTOR" || mentorUsername!==null) {
        assignments = await db.submission.findMany({
          where: {
            enrolledUser: {
              mentorUsername: mentorUsername || currentUser.username,
              courseId,
            },
          },
          include: {
            points: true,
          },
        });
        noOfTotalMentees = await db.enrolledUsers.count({
          where: {
            mentorUsername: mentorUsername || currentUser.username,
            courseId,
          },
        });
      } else if(currentUser.role === "INSTRUCTOR") {
        assignments = await db.submission.findMany({
          where: {
            assignment: {
              courseId,
            },
          },
          include: {
            points: true,
          },
        });
        noOfTotalMentees = await db.enrolledUsers.count({
          where: {
            courseId,
            user: {
              role: "STUDENT",
            }
          },
        });
      }
      let assignmentsWithPoints = 0, assignmentsWithoutPoints = 0;
      assignments?.forEach((assignment) => {
        if (assignment.points.length > 0) {
          assignmentsWithPoints += 1;
        } else {
          assignmentsWithoutPoints += 1;
        }
      });
      const noOfTotalAssignments = await db.attachment.count({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
      });
      const notSubmitted =
        noOfTotalAssignments * (noOfTotalMentees||0) - assignmentsWithPoints - assignmentsWithoutPoints;

      return [assignmentsWithPoints, assignmentsWithoutPoints, notSubmitted];
    } catch (e) {
      return { error: "Failed to fetch pichart data", details: String(e) };
    }
  },
});

export const getLinechartData = defineAction({
  input: z.object({
    courseId: z.string(),
    menteesCount: z.number(),
    mentorUsername: z.any().optional(),
  }),
  handler: async ({ courseId, menteesCount, mentorUsername }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return null;
    }
    try {
      let attendance=<any>[];
      if (currentUser.role === "MENTOR" || mentorUsername!==null) {
        attendance = await db.attendance.findMany({
          where: {
            user: {
              enrolledUsers: {
                some: {
                  mentorUsername: mentorUsername || currentUser.username,
                },
              },
            },
            attended: true,
            class: {
              course: {
                id: courseId,
              },
            },
          },
        });
      } else if(currentUser.role === "INSTRUCTOR") {
        attendance = await db.attendance.findMany({
          where: {
            attended: true,
            class: {
              courseId,
            },
          },
        });
      }
      const getAllClasses = await db.class.findMany({
        where: {
          courseId,
        },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      const classes = [] as any;
      const attendanceInEachClass = [] as any;
      getAllClasses.forEach((classData) => {
        classes.push(classData.createdAt.toISOString().split("T")[0]);
        const tem = attendance.filter((attendanceData:any) => attendanceData.classId === classData.id);
        attendanceInEachClass.push(tem?.length);
      });
      const linechartData = [];
      for (let i = 0; i < classes.length; i++) {
        linechartData.push({
          class: classes[i],
          attendees: attendanceInEachClass[i],
          absentees: menteesCount - attendanceInEachClass[i],
        });
      }
      return linechartData||[];
    } catch (e) {
      return { error: "Failed to fetch linechart data", details: String(e) };
    }
  },
});

export const getBarchartData = defineAction({
  input: z.object({
    courseId: z.string(),
    mentorUsername: z.any().optional(),
  }),
  handler: async ({ courseId, mentorUsername }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return null;
    }
    try {
      let submissionCount;
      if (currentUser.role === "MENTOR" || mentorUsername!==null) {
        submissionCount = await db.attachment.findMany({
          where: {
            attachmentType: "ASSIGNMENT",
            courseId,
          },
          include: {
            submissions: {
              where: {
                enrolledUser: {
                  mentorUsername: mentorUsername || currentUser.username,
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      } else if(currentUser.role === "INSTRUCTOR") {
        submissionCount = await db.attachment.findMany({
          where: {
            attachmentType: "ASSIGNMENT",
            courseId,
          },
          include: {
            submissions: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      }
      const assignments: string[] = [];
      const countForEachAssignment: number[] = [];
      submissionCount?.forEach((submission) => {
        assignments.push(submission.title);
        countForEachAssignment.push(submission.submissions.length);
      });
      const barchartData = [];
      for (let i = 0; i < assignments.length; i++) {
        barchartData.push({
          assignment: assignments[i],
          submissions: countForEachAssignment[i],
        });
      }
      return barchartData||[];
    } catch (e) {
      return { error: "Failed to fetch barchart data", details: String(e) };
    }
  },
});

export const getAllMentees = defineAction({
  input: z.object({
    courseId: z.string(),
    mentorUsername: z.any().optional(),
  }),
  handler: async ({ courseId, mentorUsername }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return { error: "Unauthorized" };
    }
    try {
      let students;
      if(currentUser.role === "MENTOR" || mentorUsername!==null) {
        students = await db.user.findMany({
          where: {
            enrolledUsers: {
              some: {
                course: {
                  id: courseId,
                },
                mentorUsername: mentorUsername || currentUser.username,
              },
            },
            role: "STUDENT",
          },
          include: {
            course: true,
            enrolledUsers: true,
          },
        });
      } else if(currentUser.role === "INSTRUCTOR") {
        students = await db.user.findMany({
          where: {
            enrolledUsers: {
              some: {
                course: {
                  id: courseId,
                },
              },
            },
            role: "STUDENT",
          },
          include: {
            course: true,
            enrolledUsers: true,
          },
        });
      }

      return students||[];
    } catch (e) {
      return { error: "Failed to fetch barchart data", details: String(e) };
    }
  },
});

export const getAllMentors = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  handler: async ({ courseId }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return { error: "Unauthorized" };
    }
    try {
      const mentors = await db.user.findMany({
        where: {
          enrolledUsers: {
            some: {
              course: {
                id: courseId,
              },
            },
          },
          role: "MENTOR",
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
      });

      return mentors;
    } catch (e) {
      return { error: "Failed to fetch barchart data", details: String(e) };
    }
  },
});

export const studentBarchartData = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  handler: async ({ courseId }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return null;
    }
    try {
      let assignments = await db.submission.findMany({
        where: {
          enrolledUser: {
            username: "23071A0522",
          },
          assignment: {
            courseId,
          },
        },
        include: {
          points: true,
        },
      });
      let totalPoints = 0;
      const tem = assignments;
      assignments = assignments.filter(
        (assignment) => assignment.points.length > 0,
      );
      const underReview = tem.length - assignments.length;
      assignments.forEach((assignment) => {
        assignment.points.forEach((point) => {
          totalPoints += point.score;
        });
      });
      const noOfTotalAssignments = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
      });
      let totalAssignments = 0;
      noOfTotalAssignments.forEach((assignment) => {
        totalAssignments += assignment.maxSubmissions ?? 0;
      });
      return {
        evaluated: assignments.length || 0,
        unreviewed: underReview,
        unsubmitted: totalAssignments - assignments.length - underReview,
        totalPoints: totalPoints,
      };
    } catch (e) {
      return { error: "Failed to fetch barchart data", details: String(e) };
    }
  },
});

export const studentHeatmapData = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  handler: async ({ courseId }, { locals }) => {
    const currentUser = locals.user;
    if (!currentUser) {
      return null;
    }
    try {
      const attendance = await db.attendance.findMany({
        where: {
          username: "23071A0572",
          AND: {
            class: {
              course: {
                id: courseId,
              },
            },
          },
        },
        select: {
          class: {
            select: {
              createdAt: true,
            },
          },
        },
      });
      const attendanceDates = [] as any;
      attendance.forEach((attendanceData) => {
        attendanceDates.push(
          attendanceData.class.createdAt.toISOString().split("T")[0],
        );
      });
    
      const getAllClasses = await db.class.findMany({
        where: {
          courseId,
          Attendence: {
            some: {},
          },
        },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      const classes = [] as any;
      getAllClasses.forEach((classData) => {
        // if (!attendanceDates.includes(classData.createdAt.toISOString().split("T")[0])) {
        classes.push(classData.createdAt.toISOString().split("T")[0]);
        // }
      });
      return { classes, attendanceDates };
    } catch (e) {
      return { error: "Failed to fetch barchart data", details: String(e) };
    }
  },
});