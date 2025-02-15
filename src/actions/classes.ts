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

    const { classId, classTitle, videoLink, videoType, folderId, folderName, createdAt } = data;

    try {
      // First get the existing class
      const existingClass = await db.class.findUnique({
        where: { id: classId },
        include: { video: true },
      });

      if (!existingClass) {
        throw new Error("Class not found");
      }

      // Update video
      await db.video.update({
        where: { id: existingClass.video!.id },
        data: {
          videoLink: videoLink ?? null,
          videoType,
        },
      });

      // Handle folder logic
      let finalFolderId: string | null = null;

      if (folderName) {
        // Create new folder
        const newFolder = await db.folder.create({
          data: {
            title: folderName,
            createdAt: new Date(createdAt ?? new Date()),
          },
        });
        finalFolderId = newFolder.id;
      } else if (folderId) {
        // Use existing folder
        finalFolderId = folderId;
      }
      // If neither folderName nor folderId is provided, finalFolderId remains null

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
