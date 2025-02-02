import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const attendanceRouter = createTRPCRouter({
  postAttendance: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        data: z.array(z.any()),
        maxInstructionDuration: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parsedData = JSON.parse(JSON.stringify(input.data));

      const postAttendance = await ctx.db.attendance.createMany({
        data: parsedData.map((student: any) => ({
          classId: input.classId,
          username: student.username,
          attendedDuration: student.Duration,
          data: student?.Joins,
          attended: student.Duration >= (60 * input.maxInstructionDuration) / 100,
        })),
      });

      return { success: true, data: postAttendance };
    }),

  getAttendanceForMentorByIdBarChart: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendance = await ctx.db.attendance.findMany({
        where: {
          user: {
            enrolledUsers: {
              some: {
                mentorUsername: input.id,
              },
            },
          },
          attended: true,
        },
      });

      const getAllClasses = await ctx.db.class.findMany({
        where: {
          courseId: input.courseId,
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
        const tem = attendance.filter((attendanceData) => attendanceData.classId === classData.id);
        attendanceInEachClass.push(tem.length);
      });

      return { success: true, data: { classes, attendanceInEachClass } };
    }),

  getAttendanceForMentorBarChart: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;

      let attendance;
      if (currentUser.role === "MENTOR") {
        attendance = await ctx.db.attendance.findMany({
          where: {
            user: {
              enrolledUsers: {
                some: {
                  mentorUsername: currentUser.username,
                },
              },
            },
            attended: true,
            class: {
              course: {
                id: input.courseId,
              },
            },
          },
        });
      } else {
        attendance = await ctx.db.attendance.findMany({
          where: {
            attended: true,
            class: {
              courseId: input.courseId,
            },
          },
        });
      }

      const getAllClasses = await ctx.db.class.findMany({
        where: {
          courseId: input.courseId,
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
        const tem = attendance.filter((attendanceData) => attendanceData.classId === classData.id);
        attendanceInEachClass.push(tem.length);
      });

      return { success: true, data: { classes, attendanceInEachClass } };
    }),

  getAttedanceByClassId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendance = await ctx.db.attendance.findMany({
        where: {
          classId: input.id,
        },
      });

      return { success: true, data: attendance };
    }),

  getAttendanceOfStudent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendance = await ctx.db.attendance.findMany({
        where: {
          username: input.id,
          AND: {
            class: {
              course: {
                id: input.courseId,
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
        attendanceDates.push(attendanceData.class.createdAt.toISOString().split("T")[0]);
      });

      const getAllClasses = await ctx.db.class.findMany({
        where: {
          courseId: input.courseId,
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
        if (!attendanceDates.includes(classData.createdAt.toISOString().split("T")[0])) {
          classes.push(classData.createdAt.toISOString().split("T")[0]);
        }
      });

      return { success: true, data: { classes, attendanceDates } };
    }),

  deleteClassAttendance: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;

      if (!currentUser) {
        return { error: "You must be logged in to attend a class" };
      }
      if (currentUser.role !== "INSTRUCTOR") {
        return { error: "You must be an instructor to delete an attendance" };
      }

      const attendance = await ctx.db.attendance.deleteMany({
        where: {
          classId: input.classId,
        },
      });

      return { success: true, data: attendance };
    }),

  getTotalNumberOfClassesAttended: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;

    if (!currentUser || currentUser.role === "STUDENT") {
      return { error: "You must be logged in as an instructor or mentor to view attendance" };
    }

    let attendance;
    if (currentUser.role === "MENTOR") {
      attendance = await ctx.db.attendance.findMany({
        where: {
          user: {
            enrolledUsers: {
              some: {
                mentorUsername: currentUser.username,
              },
            },
          },
        },
        select: {
          username: true,
          user: true,
          attended: true,
        },
      });
    } else {
      attendance = await ctx.db.attendance.findMany({
        where: {
          user: {
            role: "STUDENT",
          },
        },
        select: {
          username: true,
          user: true,
          attended: true,
        },
      });
    }

    const groupByTotalAttendance = [] as any;

    attendance.forEach((attendanceData) => {
      if (attendanceData.attended) {
        if (groupByTotalAttendance[attendanceData.username]) {
          groupByTotalAttendance[attendanceData.username] = {
            ...groupByTotalAttendance[attendanceData.username],
            count: groupByTotalAttendance[attendanceData.username].count + 1,
          };
        } else {
          groupByTotalAttendance[attendanceData.username] = {
            username: attendanceData.username,
            name: attendanceData.user.name,
            mail: attendanceData.user.email,
            image: attendanceData.user.image,
            role: attendanceData.user.role,
            count: 1,
          };
        }
      }
    });

    return { success: true, data: groupByTotalAttendance };
  }),

  getAttendanceForLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) throw new Error("Unauthorized");

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

    const groupedAttendance = attendance.reduce((acc: any, curr: any) => {
      const username = curr.user.username;
      acc[username] = (acc[username] || 0) + 1;
      return acc;
    }, {});

    return { success: true, data: groupedAttendance };
  }),

  serverActionOfgetTotalNumberOfClassesAttended: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        role: z.enum(["STUDENT", "MENTOR", "INSTRUCTOR"]),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      let attendance;
      if (input.role === "MENTOR") {
        attendance = await ctx.db.attendance.findMany({
          where: {
            user: {
              enrolledUsers: {
                some: {
                  mentorUsername: input.username,
                  courseId: input.courseId,
                },
              },
            },
          },
          select: {
            username: true,
            user: true,
            attended: true,
          },
        });
      } else {
        attendance = await ctx.db.attendance.findMany({
          where: {
            user: {
              role: "STUDENT",
            },
            class: {
              courseId: input.courseId,
            },
          },
          select: {
            username: true,
            user: true,
            attended: true,
          },
        });
      }

      const groupByTotalAttendance = [] as any;

      attendance.forEach((attendanceData) => {
        if (attendanceData.attended) {
          if (groupByTotalAttendance[attendanceData.username]) {
            groupByTotalAttendance[attendanceData.username] = {
              ...groupByTotalAttendance[attendanceData.username],
              count: groupByTotalAttendance[attendanceData.username].count + 1,
            };
          } else {
            groupByTotalAttendance[attendanceData.username] = {
              username: attendanceData.username,
              name: attendanceData.user.name,
              mail: attendanceData.user.email,
              image: attendanceData.user.image,
              role: attendanceData.user.role,
              count: 1,
            };
          }
        }
      });

      return groupByTotalAttendance;
    }),

  serverActionOftotatlNumberOfClasses: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const getAllClasses = await ctx.db.class.count({
        where: {
          courseId: input.courseId,
        },
      });

      return getAllClasses;
    }),

  getAttendanceOfAllStudents: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;

    const enrolledUsers = await ctx.db.enrolledUsers.findMany({
      where: {
        username: currentUser?.username || "",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const courseId = enrolledUsers[0]?.courseId || "";

    if (!currentUser) {
      return { error: "You must be logged in to attend a class" };
    }

    let totalAttendance;
    if (currentUser.role === "MENTOR") {
      totalAttendance = await ctx.db.attendance.findMany({
        where: {
          user: {
            enrolledUsers: {
              some: {
                mentorUsername: currentUser.username,
                courseId,
              },
            },
          },
        },
        select: {
          username: true,
          user: true,
          attended: true,
        },
      });
    } else {
      totalAttendance = await ctx.db.attendance.findMany({
        where: {
          user: {
            role: "STUDENT",
          },
          class: {
            courseId,
          },
        },
        select: {
          username: true,
          user: true,
          attended: true,
        },
      });
    }

    const totalCount = await ctx.db.class.count({
      where: {
        courseId,
      },
    });

    const groupByTotalAttendance = [] as any;
    totalAttendance.forEach((attendanceData) => {
      if (attendanceData.attended) {
        if (groupByTotalAttendance[attendanceData.username]) {
          groupByTotalAttendance[attendanceData.username] = {
            ...groupByTotalAttendance[attendanceData.username],
            count: groupByTotalAttendance[attendanceData.username].count + 1,
          };
        } else {
          groupByTotalAttendance[attendanceData.username] = {
            username: attendanceData.username,
            name: attendanceData.user.name,
            mail: attendanceData.user.email,
            image: attendanceData.user.image,
            role: attendanceData.user.role,
            count: 1,
          };
        }
      }
    });

    const jsonData = groupByTotalAttendance
      ? Object.entries(groupByTotalAttendance).map(([_, value]: [string, any]) => ({
          username: value.username,
          name: value.name,
          mail: value.mail,
          image: value.image,
          role: value.role,
          percentage: (Number(value.count) * 100) / Number(totalCount),
        }))
      : [];

    return { success: true, data: jsonData };
  }),

  viewAttendanceByClassId: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;

      if (!currentUser) {
        return { error: "You must be logged in to view attendance" };
      }

      if (currentUser.role === "STUDENT") {
        return { error: "You must be an instructor or mentor to view attendance" };
      }

      const attendance =
        currentUser.role === "MENTOR"
          ? await ctx.db.attendance.findMany({
              where: {
                classId: input.classId,
                user: {
                  enrolledUsers: {
                    some: {
                      mentorUsername: currentUser.username,
                    },
                  },
                },
              },
            })
          : await ctx.db.attendance.findMany({
              where: {
                classId: input.classId,
              },
            });

      let present = 0;

      attendance.forEach((ele) => {
        if (ele.attended) {
          present++;
        }
      });

      return { success: true, data: { attendance, present } };
    }),
});
