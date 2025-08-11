import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

type ClassEvent = "class.created" | "class.updated";

async function triggerN8nForClassEvent(params: {
  event: ClassEvent;
  classId: string;
  classTitle: string;
  courseId: string;
  previousCreatedAt?: Date;
  newCreatedAt?: Date;
}) {
  try {
    const n8nUrl = import.meta.env.N8N_CLASS_WEBHOOK_URL as string | undefined;
    if (!n8nUrl) return;

    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        title: true,
        whatsappGroupId: true,
        whatsappGroupName: true,
        whatsappBotEnabled: true,
        whatsappBotConfig: true,
      },
    });

    const payload: any = {
      event: params.event,
      class: {
        id: params.classId,
        title: params.classTitle,
        courseId: params.courseId,
      },
      course: course
        ? {
            id: course.id,
            title: course.title,
            whatsappGroupId: course.whatsappGroupId,
            whatsappGroupName: course.whatsappGroupName,
            whatsappBotEnabled: course.whatsappBotEnabled,
            whatsappBotConfig: course.whatsappBotConfig,
          }
        : undefined,
      meta: {
        triggeredAt: new Date().toISOString(),
        correlationId: params.classId,
      },
    };

    if (params.previousCreatedAt && params.newCreatedAt) {
      payload.class.previousCreatedAt = params.previousCreatedAt.toISOString();
      payload.class.newCreatedAt = params.newCreatedAt.toISOString();
    }

    const controller = new AbortController();
    const timeoutMs = Number(import.meta.env.N8N_TIMEOUT_MS ?? 5000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(import.meta.env.N8N_AUTH_TOKEN
            ? { Authorization: `Bearer ${import.meta.env.N8N_AUTH_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      console.error(`n8n webhook (${params.event}) failed:`, err);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (outerErr) {
    console.error("n8n trigger wrapper failed:", outerErr);
  }
}

export const createClass = defineAction({
  input: z.object({
    classTitle: z.string().trim().min(1, {
      message: "Title is required",
    }),
    videoLink: z.string().nullable(),
    videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
    courseId: z.string().trim().min(1),
    createdAt: z.string().optional(),
    folderId: z.string().optional(),
    folderName: z.string().optional(),
  }),
  handler: async ({
    classTitle,
    videoLink,
    videoType,
    courseId,
    folderId,
    folderName,
    createdAt,
  }) => {
    try {
      const classData = {
        title: classTitle,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        video: {
          create: {
            videoLink: videoLink ?? null,
            videoType: videoType,
          },
        },
        course: {
          connect: {
            id: courseId,
          },
        },
      };

      if (folderId) {
        const created = await db.class.create({
          data: {
            ...classData,
            Folder: {
              connect: {
                id: folderId,
              },
            },
          },
        });
        // Fire-and-forget n8n trigger
        triggerN8nForClassEvent({
          event: "class.created",
          classId: created.id,
          classTitle,
          courseId,
        }).catch(() => {});
        return created;
      } else if (folderName) {
        const created = await db.class.create({
          data: {
            ...classData,
            Folder: {
              create: {
                title: folderName,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
              },
            },
          },
        });
        // Fire-and-forget n8n trigger
        triggerN8nForClassEvent({
          event: "class.created",
          classId: created.id,
          classTitle,
          courseId,
        }).catch(() => {});
        return created;
      }

      const created = await db.class.create({
        data: classData,
      });
      // Fire-and-forget n8n trigger
      triggerN8nForClassEvent({
        event: "class.created",
        classId: created.id,
        classTitle,
        courseId,
      }).catch(() => {});
      return created;
    } catch (error) {
      console.error("Error creating class:", error);
      throw new Error("Error creating class");
    }
  },
});

export const editClassSchema = z.object({
  classId: z.string(),
  courseId: z.string(),
  classTitle: z.string(),
  videoLink: z.string().nullable(),
  videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
  folderId: z.string().optional(),
  folderName: z.string().optional(),
  createdAt: z.string().optional(),
});

export type EditClassType = z.infer<typeof editClassSchema>;

export const updateClass = defineAction({
  input: editClassSchema,
  handler: async (data, { locals }) => {
    const currentUser = locals.user;
    const isCourseAdmin = currentUser?.adminForCourses?.some(
      (course: { id: string }) => course.id === data.courseId
    );
    const haveAccess = currentUser && (currentUser.role === "INSTRUCTOR" || isCourseAdmin);

    if (!haveAccess) {
      throw new Error("You are not authorized to update this class.");
    }

    const { classId, classTitle, videoLink, videoType, folderId, folderName, createdAt } = data;

    try {
      const existingClass = await db.class.findUnique({
        where: { id: classId },
        include: { video: true },
      });

      if (!existingClass) {
        throw new Error("Class not found");
      }

      const previousCreatedAt = existingClass.createdAt;

      await db.video.update({
        where: { id: existingClass.video!.id },
        data: {
          videoLink: videoLink ?? null,
          videoType,
        },
      });

      let finalFolderId: string | null = null;

      if (folderName) {
        const newFolder = await db.folder.create({
          data: {
            title: folderName,
            createdAt: new Date(createdAt ?? new Date()),
          },
        });
        finalFolderId = newFolder.id;
      } else if (folderId) {
        finalFolderId = folderId;
      }

      const updatedClass = await db.class.update({
        where: { id: classId },
        data: {
          title: classTitle,
          createdAt: new Date(createdAt ?? new Date()),
          folderId: finalFolderId,
        },
        include: {
          video: true,
          Folder: true,
        },
      });

      triggerN8nForClassEvent({
        event: "class.updated",
        classId,
        classTitle,
        courseId: data.courseId,
        previousCreatedAt,
        newCreatedAt: updatedClass.createdAt,
      }).catch(() => {});

      return { success: true, data: updatedClass };
    } catch (error) {
      console.error("Error updating class:", error);
      return { error: "Failed to update class" };
    }
  },
});

export const deleteClass = defineAction({
  input: z.object({
    classId: z.string(),
  }),
  handler: async ({ classId }) => {
    try {
      await db.class.delete({
        where: {
          id: classId,
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting class:", error);
      throw new Error("Failed to delete class. Please try again later.");
    }
  },
});

export const totalNumberOfClasses = defineAction({
  handler: async () => {
    try {
      const res = await db.class.count();
      return res;
    } catch (error) {
      console.error("Error getting total number of classes:", error);
      throw new Error("Failed to get total number of classes. Please try again later.");
    }
  },
});
