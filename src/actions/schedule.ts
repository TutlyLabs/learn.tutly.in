import type { EventAttachmentType } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";
import { getEnrolledCourseIds } from "./courses";

export const getSchedule = defineAction({
  input: z.object({
    date: z.string().datetime(),
  }),
  async handler({ date }, { locals }) {
    const currentUser = locals.user!;

    // Create start and end dates for the query
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    const events = await db.scheduleEvent.findMany({
      where: {
        AND: [
          {
            startTime: {
              gte: startDate,
            },
          },
          {
            startTime: {
              lt: endDate,
            },
          },
        ],
        course: {
          enrolledUsers: {
            some: { username: currentUser.username },
          },
        },
      },
      include: {
        attachments: {
          orderBy: {
            ordering: "asc",
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      events,
    };
  },
});

export const createEvent = defineAction({
  input: z.object({
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    courseId: z.string(),
    isPublished: z.boolean(),
  }),
  async handler({ title, startTime, endTime, courseId, isPublished }, { locals }) {
    const currentUser = locals.user!;

    if (currentUser.role !== "INSTRUCTOR") {
      throw new Error("You are not authorized to create events");
    }

    const userCourseIds = await getEnrolledCourseIds(currentUser.username);
    if (!userCourseIds.includes(courseId)) {
      throw new Error("You do not have access to this course");
    }

    const newEvent = await db.scheduleEvent.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        courseId,
        createdById: currentUser.id,
        isPublished,
      },
      include: {
        attachments: true,
      },
    });

    return {
      event: newEvent,
    };
  },
});

export const updateEvent = defineAction({
  input: z.object({
    id: z.string(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isPublished: z.boolean(),
  }),
  async handler({ id, title, startTime, endTime, isPublished }, { locals }) {
    const currentUser = locals.user!;

    if (currentUser.role !== "INSTRUCTOR") {
      throw new Error("You are not authorized to update events");
    }

    await db.eventAttachment.deleteMany({
      where: { eventId: id },
    });

    const updatedEvent = await db.scheduleEvent.update({
      where: { id },
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isPublished,
      },
      include: {
        attachments: true,
      },
    });

    return {
      event: updatedEvent,
    };
  },
});

export const deleteEvent = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }, { locals }) {
    const currentUser = locals.user!;

    const event = await db.scheduleEvent.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (currentUser.role !== "INSTRUCTOR" && event?.course?.createdById !== currentUser.id) {
      throw new Error("You are not authorized to delete events");
    }

    await db.scheduleEvent.delete({
      where: { id },
    });

    return {
      success: true,
    };
  },
});

export const addAttachment = defineAction({
  input: z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum([
      "YOUTUBE",
      "YOUTUBE_LIVE",
      "GMEET",
      "JIOMEET",
      "TEXT",
      "VIMEO",
      "VIDEOCRYPT",
      "DOCUMENT",
      "OTHER",
    ] as const satisfies readonly EventAttachmentType[]),
    link: z.string().optional().nullable(),
    details: z.string().optional().nullable(),
    ordering: z.number().optional(),
  }),
  async handler({ id, title, type, link, details, ordering }, { locals }) {
    const currentUser = locals.user!;

    if (currentUser.role !== "INSTRUCTOR") {
      throw new Error("You are not authorized to add attachments");
    }

    const newAttachment = await db.eventAttachment.create({
      data: {
        title,
        type,
        eventId: id,
        details: details ?? null,
        ordering: ordering ?? 1,
        link: link ?? null,
      },
    });

    return {
      attachment: newAttachment,
    };
  },
});
