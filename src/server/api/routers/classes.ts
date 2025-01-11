import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { classes, folders, videos } from "~/server/db/schema";

export const classesRouter = createTRPCRouter({
  create: instructorProcedure
    .input(
      z.object({
        classTitle: z.string().trim().min(1, { message: "Title is required" }),
        videoLink: z.string().nullable(),
        videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
        courseId: z.string().trim().min(1),
        createdAt: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();

      const [video] = await ctx.db.insert(videos).values({
        videoLink: input.videoLink,
        videoType: input.videoType,
      }).returning();

      if (!video) {
        throw new Error("Failed to create video");
      }

      let folder;
      if (input.folderId) {
        [folder] = await ctx.db.select().from(folders).where(eq(folders.id, input.folderId));
      } else if (input.folderName) {
        [folder] = await ctx.db.insert(folders).values({
          title: input.folderName,
          createdAt,
        }).returning();
      }

      const [newClass] = await ctx.db.insert(classes).values({
        title: input.classTitle,
        createdAt,
        videoId: video.id,
        courseId: input.courseId,
        folderId: folder?.id,
      }).returning();

      return newClass;
    }),

  update: instructorProcedure
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
      const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();

      let folder;
      if (input.folderId && input.folderName) {
        [folder] = await ctx.db
          .update(folders)
          .set({
            title: input.folderName,
            createdAt,
          })
          .where(eq(folders.id, input.folderId))
          .returning();
      } else if (input.folderName) {
        [folder] = await ctx.db
          .insert(folders)
          .values({
            title: input.folderName,
            createdAt,
          })
          .returning();
      }

      const [updatedClass] = await ctx.db
        .update(classes)
        .set({
          title: input.classTitle,
          createdAt,
          folderId: folder?.id ?? input.folderId,
        })
        .where(eq(classes.id, input.classId))
        .returning();

      return updatedClass;
    }),

  delete: instructorProcedure
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(classes).where(eq(classes.id, input.classId));
      return { success: true };
    }),

  getTotalCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.select().from(classes);
    return result.length;
  }),
}); 