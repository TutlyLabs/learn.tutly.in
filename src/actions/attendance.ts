// todo: fix overall attendance for mentor exceeding 100%
import { Role } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const postAttendance = defineAction({
  input: z.object({
    classId: z.string(),
    data: z.array(z.any()),
    maxInstructionDuration: z.number(),
  }),
  async handler({ classId, data, maxInstructionDuration }) {
    const parsedData = JSON.parse(JSON.stringify(data));

    const postAttendance = await db.attendance.createMany({
      data: [
        ...parsedData.map((student: any) => {
          if (student.Duration >= (maxInstructionDuration)) {
            return {
              classId,
              username: student.username,
              attendedDuration: student.Duration,
              data: student?.Joins,
              attended: true,
            };
          }
          return {
            classId,
            username: student.username,
            attendedDuration: student.Duration,
            data: student?.Joins,
          };
        }),
      ],
    });

    return { success: true, data: postAttendance };
  },
});

export const getAttendanceForMentorByIdBarChart = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string(),
  }),
  async handler({ id, courseId }) {
    const attendance = await db.attendance.findMany({
      where: {
        user: {
          enrolledUsers: {
            some: {
              mentorUsername: id,
            },
          },
        },
        attended: true,
      },
    });

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
      const tem = attendance.filter((attendanceData) => attendanceData.classId === classData.id);
      attendanceInEachClass.push(tem.length);
    });

    return { success: true, data: { classes, attendanceInEachClass } };
  },
});

export const getAttendanceForMentorBarChart = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user!;

    let attendance;
    if (currentUser.role === "MENTOR") {
      attendance = await db.attendance.findMany({
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
              id: courseId,
            },
          },
        },
      });
    } else {
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
      const tem = attendance.filter((attendanceData) => attendanceData.classId === classData.id);
      attendanceInEachClass.push(tem.length);
    });

    return { success: true, data: { classes, attendanceInEachClass } };
  },
});

export const getAttedanceByClassId = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    const attendance = await db.attendance.findMany({
      where: {
        classId: id,
      },
    });

    return { success: true, data: attendance };
  },
});

export const getAttendanceOfStudent = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string(),
  }),
  async handler({ id, courseId }) {
    const attendance = await db.attendance.findMany({
      where: {
        username: id,
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
      attendanceDates.push(attendanceData.class.createdAt.toISOString().split("T")[0]);
    });

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
    getAllClasses.forEach((classData) => {
      if (!attendanceDates.includes(classData.createdAt.toISOString().split("T")[0])) {
        classes.push(classData.createdAt.toISOString().split("T")[0]);
      }
    });

    return { success: true, data: { classes, attendanceDates } };
  },
});

export const deleteClassAttendance = defineAction({
  input: z.object({
    classId: z.string(),
  }),
  async handler({ classId }, { locals }) {
    const currentUser = locals.user!;

    if (!currentUser) {
      return { error: "You must be logged in to attend a class" };
    }
    if (currentUser.role !== "INSTRUCTOR") {
      return { error: "You must be an instructor to delete an attendance" };
    }

    const attendance = await db.attendance.deleteMany({
      where: {
        classId,
      },
    });

    return { success: true, data: attendance };
  },
});

export const getTotalNumberOfClassesAttended = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user!;

    if (!currentUser || currentUser.role === "STUDENT") {
      return { error: "You must be logged in as an instructor or mentor to view attendance" };
    }

    let attendance;
    if (currentUser.role === "MENTOR") {
      attendance = await db.attendance.findMany({
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
      attendance = await db.attendance.findMany({
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
  },
});

export const getAttendanceForLeaderbaord = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user!;

    if (!currentUser) {
      return { error: "You must be logged in to attend a class" };
    }

    const attendance = await db.attendance.findMany({
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
  },
});

export const serverActionOfgetTotalNumberOfClassesAttended = async (
  username: string,
  role: Role,
  courseId: string
) => {
  let attendance;
  if (role === "MENTOR") {
    attendance = await db.attendance.findMany({
      where: {
        user: {
          enrolledUsers: {
            some: {
              mentorUsername: username,
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
    attendance = await db.attendance.findMany({
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
};

export const serverActionOftotatlNumberOfClasses = async (courseId: string) => {
  const getAllClasses = await db.class.count({
    where: {
      courseId,
    },
  });

  return getAllClasses;
};

export const getAttendanceOfAllStudents = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user!;

    const enrolledUsers = await db.enrolledUsers.findMany({
      where: {
        username: currentUser?.username || "",
        user: {
          organizationId: currentUser.organizationId,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const courseId = enrolledUsers[0]?.courseId || "";

    if (!currentUser) {
      return { error: "You must be logged in to attend a class" };
    }

    const totalAttendance = await serverActionOfgetTotalNumberOfClassesAttended(
      currentUser.username,
      currentUser.role,
      courseId
    );
    const totalCount = await serverActionOftotatlNumberOfClasses(courseId);

    const jsonData = totalAttendance
      ? Object.entries(totalAttendance).map(([_, value]: [string, any]) => ({
          username: value.username,
          name: value.name,
          mail: value.mail,
          image: value.image,
          role: value.role,
          percentage: (Number(value.count) * 100) / Number(totalCount),
        }))
      : [];

    return { success: true, data: jsonData };
  },
});

export const viewAttendanceByClassId = defineAction({
  input: z.object({
    classId: z.string(),
  }),
  async handler({ classId }, { locals }) {
    const currentUser = locals.user!;

    if (!currentUser) {
      return { error: "You must be logged in to view attendance" };
    }

    if (currentUser.role === "STUDENT") {
      return { error: "You must be an instructor or mentor to view attendance" };
    }

    const attendance =
      currentUser.role === "MENTOR"
        ? await db.attendance.findMany({
            where: {
              classId: classId,
              user: {
                enrolledUsers: {
                  some: {
                    mentorUsername: currentUser.username,
                  },
                },
              },
            },
            include: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          })
        : await db.attendance.findMany({
            where: {
              classId: classId,
            },
            include: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          });

    let present = 0;

    attendance.forEach((ele) => {
      if (ele.attended) {
        present++;
      }
    });

    return { success: true, data: { attendance, present } };
  },
});
