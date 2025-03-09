import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

import { getEnrolledCourseIds } from "./courses";

export const getUserDoubtsByCourseId = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const doubts = await db.doubt.findMany({
      where: {
        courseId: courseId,
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
  },
});

export const getEnrolledCoursesDoubts = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
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
  },
});

export const getCreatedCoursesDoubts = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courseIds = await getEnrolledCourseIds(currentUser.username);

    const courses = await db.course.findMany({
      where: {
        id: {
          in: courseIds,
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
  },
});

export const getAllDoubtsForMentor = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
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
  },
});

export const createDoubt = defineAction({
  input: z.object({
    courseId: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  async handler({ courseId, title, description }, { locals }) {
    const currentUser = locals.user!;

    if (currentUser.role === "INSTRUCTOR") {
      const userCourseIds = await getEnrolledCourseIds(currentUser.username);
      if (!userCourseIds.includes(courseId)) {
        throw new Error("You do not have access to this course");
      }
    }

    const doubt = await db.doubt.create({
      data: {
        courseId: courseId,
        userId: currentUser.id,
        title: title ?? null,
        description: description ?? null,
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
  },
});

export const createResponse = defineAction({
  input: z.object({
    doubtId: z.string(),
    description: z.string(),
  }),
  async handler({ doubtId, description }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const response = await db.response.create({
      data: {
        doubtId: doubtId,
        userId: currentUser.id,
        description: description,
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
  },
});

export const deleteDoubt = defineAction({
  input: z.object({
    doubtId: z.string(),
  }),
  async handler({ doubtId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const doubt = await db.doubt.delete({
      where: {
        id: doubtId,
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
  },
});

export const deleteAnyDoubt = defineAction({
  input: z.object({
    doubtId: z.string(),
  }),
  async handler({ doubtId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const doubt = await db.doubt.delete({
      where: {
        id: doubtId,
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
  },
});

export const deleteResponse = defineAction({
  input: z.object({
    responseId: z.string(),
  }),
  async handler({ responseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const response = await db.response.delete({
      where: {
        id: responseId,
      },
    });
    return { success: true, data: response };
  },
});
