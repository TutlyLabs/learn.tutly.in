import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const classesRouter = createTRPCRouter({
  createClass: protectedProcedure
    .input(
      z.object({
        classTitle: z.string().trim().min(1, {
          message: "Title is required",
        }),
        videoLink: z.string().nullable(),
        videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
        courseId: z.string().trim().min(1),
        createdAt: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const classData = {
          title: input.classTitle,
          createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
          video: {
            create: {
              videoLink: input.videoLink ?? null,
              videoType: input.videoType,
            },
          },
          course: {
            connect: {
              id: input.courseId,
            },
          },
        };

        if (input.folderId) {
          return await ctx.db.class.create({
            data: {
              ...classData,
              Folder: {
                connect: {
                  id: input.folderId,
                },
              },
            },
          });
        } else if (input.folderName) {
          return await ctx.db.class.create({
            data: {
              ...classData,
              Folder: {
                create: {
                  title: input.folderName,
                  createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                },
              },
            },
          });
        }

        return await ctx.db.class.create({
          data: classData,
        });
      } catch (error) {
        throw new Error("Error creating class");
      }
    }),

  updateClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        courseId: z.string(),
        classTitle: z.string(),
        videoLink: z.string().nullable(),
        videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        createdAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      const isCourseAdmin = currentUser?.adminForCourses?.some(
        (course: { id: string }) => course.id === input.courseId
      );
      const haveAccess = currentUser && (currentUser.role === "INSTRUCTOR" || isCourseAdmin);

      if (!haveAccess) {
        throw new Error("You are not authorized to update this class.");
      }

      let newFolderId: string | undefined = undefined;

      if (input.folderId && input.folderName) {
        await ctx.db.folder.update({
          where: {
            id: input.folderId,
          },
          data: {
            title: input.folderName,
            createdAt: new Date(input.createdAt ?? ""),
          },
        });
        newFolderId = input.folderId;
      } else if (input.folderName) {
        const res = await ctx.db.folder.create({
          data: {
            title: input.folderName,
            createdAt: new Date(input.createdAt ?? ""),
          },
        });
        newFolderId = res.id;
      } else {
        newFolderId = input.folderId;
      }

      try {
        const myClass = await ctx.db.class.update({
          where: {
            id: input.classId,
          },
          data: {
            title: input.classTitle,
            createdAt: new Date(input.createdAt ?? ""),
            video: {
              update: {
                videoLink: input.videoLink ?? null,
                videoType: input.videoType,
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
        throw new Error("Failed to update class. Please try again later.");
      }
    }),

  deleteClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.class.delete({
          where: {
            id: input.classId,
          },
        });
        return { success: true };
      } catch (error) {
        throw new Error("Failed to delete class. Please try again later.");
      }
    }),

  totalNumberOfClasses: protectedProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.db.class.count();
      return res;
    } catch (error) {
      throw new Error("Failed to get total number of classes. Please try again later.");
    }
  }),

  getClassDetails: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.class.findUnique({
        where: {
          id: input.id,
        },
        include: {
          video: true,
          attachments: true,
          Folder: true,
        },
      });
    }),

  getClassesWithFolders: protectedProcedure
    .input(
      z.object({
        courseId: z.string().trim().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const classes = await ctx.db.class.findMany({
        where: {
          courseId: input.courseId,
        },
        include: {
          Folder: true,
        },
      });
      return classes;
    }),
});
