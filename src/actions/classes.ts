import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

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
        return await db.class.create({
          data: {
            ...classData,
            Folder: {
              connect: {
                id: folderId,
              },
            },
          },
        });
      } else if (folderName) {
        return await db.class.create({
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
      }

      return await db.class.create({
        data: classData,
      });
    } catch (error) {
      console.error("Error creating class:", error);
      throw new Error("Error creating class");
    }
  },
});

// Update the EditClassType interface
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

    const { classTitle, videoLink, videoType, folderId, folderName, createdAt } = data;

    let newFolderId: string | undefined = undefined;

    if (folderId && folderName) {
      await db.folder.update({
        where: {
          id: folderId,
        },
        data: {
          title: folderName,
          createdAt: new Date(createdAt ?? ""),
        },
      });
      newFolderId = folderId;
    } else if (folderName) {
      const res = await db.folder.create({
        data: {
          title: folderName,
          createdAt: new Date(createdAt ?? ""),
        },
      });
      newFolderId = res.id;
    } else {
      newFolderId = folderId;
    }

    try {
      const myClass = await db.class.update({
        where: {
          id: data.classId,
        },
        data: {
          title: classTitle,
          createdAt: new Date(createdAt ?? ""),
          video: {
            update: {
              videoLink: videoLink ?? null,
              videoType: videoType,
            },
          },
          ...(newFolderId && {
            Folder: {
              connect: {
                id: newFolderId,
              },
            },
          }),
        },
      });

      return myClass;
    } catch (error) {
      console.error("Error updating class:", error);
      throw new Error("Failed to update class. Please try again later.");
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
