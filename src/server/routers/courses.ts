import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const coursesRouter = createTRPCRouter({
  getAllCourses: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    let courses;

    if (currentUser.role === "INSTRUCTOR") {
      courses = await ctx.db.course.findMany({
        where: {
          createdById: currentUser.id,
        },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });
    } else if (currentUser.role === "MENTOR") {
      courses = await ctx.db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
            },
          },
        },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });
    } else {
      courses = await ctx.db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              user: {
                id: currentUser.id,
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });
    }

    return { success: true, data: courses };
  }),

  getCourseClasses: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const classes = await ctx.db.class.findMany({
        where: {
          courseId: input.id,
        },
        include: {
          course: true,
          video: true,
          attachments: true,
          Folder: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return { success: true, data: classes };
    }),

  foldersByCourseId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.folder.findMany({
        where: {
          Class: {
            some: {
              courseId: input.id,
            },
          },
        },
      });
      return folders ?? [];
    }),

  getEnrolledCourses: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    const courses = await ctx.db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            username: currentUser.username,
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
        courseAdmins: true,
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    const publishedCourses = courses.filter((course) => course.isPublished);

    if (currentUser.role === "INSTRUCTOR") {
      return { success: true, data: courses };
    }
    return { success: true, data: publishedCourses };
  }),

  getCreatedCourses: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    const courses = await ctx.db.course.findMany({
      where: {
        createdById: currentUser.id,
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    return { success: true, data: courses };
  }),

  getEnrolledCoursesById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const courses = await ctx.db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              user: {
                id: input.id,
              },
            },
          },
        },
        include: {
          classes: true,
          createdBy: true,
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });
      return { success: true, data: courses };
    }),

  getMentorStudents: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const students = await ctx.db.user.findMany({
        where: {
          role: "STUDENT",
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
              courseId: input.courseId,
            },
          },
          organizationId: currentUser.organizationId,
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
        orderBy: {
          username: "asc",
        },
      });

      return { success: true, data: students };
    }),

  getMentorStudentsById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const students = await ctx.db.user.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: input.id,
              courseId: input.courseId,
            },
          },
          organizationId: currentUser.organizationId,
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
        orderBy: {
          username: "asc",
        },
      });

      return { success: true, data: students };
    }),

  getEnrolledStudents: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const students = await ctx.db.user.findMany({
        where: {
          enrolledUsers: {
            some: {
              course: {
                id: input.courseId,
              },
            },
          },
          role: "STUDENT",
          organizationId: currentUser.organizationId,
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
      });

      return { success: true, data: students };
    }),

  getAllStudents: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) throw new Error("Unauthorized");

    const students = await ctx.db.user.findMany({
      where: {
        role: "STUDENT",
        organizationId: currentUser.organizationId,
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
    });

    return { success: true, data: students };
  }),

  getEnrolledMentees: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const students = await ctx.db.user.findMany({
        where: {
          role: "MENTOR",
          enrolledUsers: {
            some: {
              course: {
                id: input.courseId,
              },
            },
          },
          organizationId: currentUser.organizationId,
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
      });

      return { success: true, data: students };
    }),

  createCourse: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        isPublished: z.boolean(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (currentUser?.role !== "INSTRUCTOR") throw new Error("Unauthorized");
      if (!input.title.trim()) {
        throw new Error("Title is required");
      }

      const newCourse = await ctx.db.course.create({
        data: {
          title: input.title,
          createdById: currentUser.id,
          isPublished: input.isPublished,
          image: input.image || null,
          enrolledUsers: {
            create: {
              username: currentUser.username,
            },
          },
        },
      });
      return { success: true, data: newCourse };
    }),

  updateCourse: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        isPublished: z.boolean(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (currentUser?.role !== "INSTRUCTOR") throw new Error("Unauthorized");

      if (!input.title.trim()) {
        throw new Error("Title is required");
      }

      const course = await ctx.db.course.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          isPublished: input.isPublished,
          image: input.image || null,
        },
      });
      return course;
    }),

  getMentorCourses: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    const courses = await ctx.db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            mentorUsername: currentUser.username,
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    return { success: true, data: courses };
  }),

  getClassDetails: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const classDetails = await ctx.db.class.findUnique({
          where: {
            id: input.id,
          },
          include: {
            video: true,
            attachments: true,
            Folder: true,
          },
        });

        if (!classDetails) {
          return { success: false, error: "Class not found" };
        }

        return { success: true, data: classDetails };
      } catch (error) {
        console.error("Error fetching class details:", error);
        return { success: false, error: "Failed to fetch class details" };
      }
    }),

  getCourseByCourseId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: {
          id: input.id,
        },
      });
      return { success: true, data: course };
    }),

  enrollStudentToCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user;
        if (!currentUser || currentUser.role !== "INSTRUCTOR") {
          return { error: "Unauthorized to enroll student to course" };
        }

        const user = await ctx.db.user.findUnique({
          where: { username: input.username },
        });

        if (!user) {
          return { error: "User not found" };
        }

        const course = await ctx.db.course.findUnique({
          where: { id: input.courseId },
        });

        if (!course) {
          return { error: "Course not found" };
        }

        const existingEnrollment = await ctx.db.enrolledUsers.findFirst({
          where: {
            courseId: input.courseId,
            username: input.username,
          },
        });

        if (existingEnrollment) {
          return { error: "User is already enrolled in the course" };
        }

        const newEnrollment = await ctx.db.enrolledUsers.create({
          data: {
            courseId: input.courseId,
            username: input.username,
          },
        });

        await ctx.db.events.create({
          data: {
            eventCategory: "STUDENT_ENROLLMENT_IN_COURSE",
            causedById: currentUser.id,
            eventCategoryDataId: newEnrollment.id,
          },
        });

        return { success: true, data: newEnrollment };
      } catch {
        return { error: "Failed to enroll student" };
      }
    }),

  unenrollStudentFromCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user;
        if (!currentUser || currentUser.role !== "INSTRUCTOR") {
          return { error: "Unauthorized to unenroll student from course" };
        }

        const user = await ctx.db.user.findUnique({
          where: { username: input.username },
        });

        if (!user) {
          return { error: "User not found" };
        }

        const course = await ctx.db.course.findUnique({
          where: { id: input.courseId },
        });

        if (!course) {
          return { error: "Course not found" };
        }

        const existingEnrollment = await ctx.db.enrolledUsers.findFirst({
          where: {
            courseId: input.courseId,
            username: input.username,
          },
        });

        if (!existingEnrollment) {
          return { error: "User is not enrolled in the course" };
        }

        await ctx.db.enrolledUsers.delete({
          where: {
            id: existingEnrollment.id,
          },
        });

        return { success: true, data: existingEnrollment };
      } catch {
        return { error: "Failed to unenroll student" };
      }
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        role: z.enum(["STUDENT", "MENTOR"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user;
        if (!currentUser || currentUser.role !== "INSTRUCTOR") {
          return { error: "Unauthorized to update user role" };
        }

        const user = await ctx.db.user.findUnique({
          where: { username: input.username },
        });

        if (!user) {
          return { error: "User not found" };
        }

        const updatedUser = await ctx.db.user.update({
          where: {
            id: user.id,
          },
          data: {
            role: input.role,
          },
        });

        return { success: true, data: updatedUser };
      } catch {
        return { error: "Failed to update user role" };
      }
    }),

  updateMentor: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        username: z.string(),
        mentorUsername: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user;
        if (!currentUser || currentUser.role !== "INSTRUCTOR") {
          return { error: "Unauthorized to update mentor" };
        }

        const enrolledUser = await ctx.db.enrolledUsers.findFirst({
          where: {
            courseId: input.courseId,
            username: input.username,
          },
        });

        if (!enrolledUser) {
          return { error: "User is not enrolled in the course" };
        }

        const updatedUser = await ctx.db.enrolledUsers.update({
          where: {
            id: enrolledUser.id,
          },
          data: {
            mentorUsername: input.mentorUsername,
          },
        });

        return { success: true, data: updatedUser };
      } catch {
        return { error: "Failed to update mentor" };
      }
    }),

  deleteCourse: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (currentUser?.role !== "INSTRUCTOR") return { error: "Unauthorized" };

      try {
        await ctx.db.course.delete({
          where: {
            id: input.id,
            createdById: currentUser.id,
          },
        });

        return { success: true };
      } catch {
        return { error: "Failed to delete course" };
      }
    }),

  getUserCourses: protectedProcedure.query(async ({ ctx }) => {
    const courses = await ctx.db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            username: ctx.user.username,
          },
        },
      },
      include: {
        classes: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            classes: true,
          },
        },
        courseAdmins: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      ...course,
      classes: course.classes.sort((a, b) => Number(a.createdAt) - Number(b.createdAt)),
    }));
  }),

  getCourseAssignments: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.course.findMany({
        where: {
          id: input.courseId,
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        username: ctx.user.username,
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    }),
});
