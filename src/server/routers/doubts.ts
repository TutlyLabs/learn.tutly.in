import { z } from "zod";

import db from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const doubtsRouter = createTRPCRouter({
  getUserDoubtsByCourseId: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const doubts = await db.doubt.findMany({
        where: {
          courseId: input.courseId,
        },
        include: {
          user: true,
          course: true,
          response: {
            include: {
              user: true,
            },
          },
        },
      });
      return { success: true, data: doubts };
    }),

  createDoubt: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      const doubt = await db.doubt.create({
        data: {
          courseId: input.courseId,
          userId: currentUser.id,
          title: input.title ?? null,
          description: input.description ?? null,
        },
        include: {
          user: true,
          course: true,
          response: {
            include: {
              user: true,
            },
          },
        },
      });

      await db.events.create({
        data: {
          eventCategory: "DOUBT_CREATION",
          causedById: currentUser.id,
          eventCategoryDataId: doubt.id,
        },
      });

      return { success: true, data: doubt };
    }),

  getEnrolledCoursesDoubts: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            username: currentUser.username,
          },
        },
      },
      include: {
        doubts: {
          include: {
            user: true,
            response: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: courses };
  }),

  getCreatedCoursesDoubts: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courses = await db.course.findMany({
      where: {
        createdById: currentUser.id,
      },
      include: {
        doubts: {
          include: {
            user: true,
            response: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: courses };
  }),

  getAllDoubtsForMentor: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) return { error: "Unauthorized" };

    const mentorCourses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            mentorUsername: currentUser.username,
          },
        },
      },
    });

    if (!mentorCourses) return { error: "No courses found" };

    const courses = await db.course.findMany({
      where: {
        id: {
          in: mentorCourses.map((course) => course.id),
        },
      },
      include: {
        doubts: {
          include: {
            user: true,
            response: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: courses };
  }),

  deleteDoubt: protectedProcedure
    .input(
      z.object({
        doubtId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) return { error: "Unauthorized" };

      const doubt = await db.doubt.delete({
        where: {
          id: input.doubtId,
          userId: currentUser.id,
        },
        include: {
          user: true,
          course: true,
          response: {
            include: {
              user: true,
            },
          },
        },
      });
      return { success: true, data: doubt };
    }),

  deleteAnyDoubt: protectedProcedure
    .input(
      z.object({
        doubtId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) return { error: "Unauthorized" };

      const doubt = await db.doubt.delete({
        where: {
          id: input.doubtId,
        },
        include: {
          user: true,
          course: true,
          response: {
            include: {
              user: true,
            },
          },
        },
      });
      return { success: true, data: doubt };
    }),

  deleteResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) return { error: "Unauthorized" };

      const response = await db.response.delete({
        where: {
          id: input.responseId,
        },
      });
      return { success: true, data: response };
    }),

  createResponse: protectedProcedure
    .input(
      z.object({
        doubtId: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) return { error: "Unauthorized" };

      const response = await db.response.create({
        data: {
          doubtId: input.doubtId,
          userId: currentUser.id,
          description: input.description,
        },
        include: {
          user: true,
        },
      });

      await db.events.create({
        data: {
          eventCategory: "DOUBT_RESPONSE",
          causedById: currentUser.id,
          eventCategoryDataId: response.id,
        },
      });
      return { success: true, data: response };
    }),
});
