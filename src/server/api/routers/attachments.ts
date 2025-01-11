import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { attachments } from "~/server/db/schema";

export const attachmentsRouter = createTRPCRouter({
  create: instructorProcedure
    .input(
      z.object({
        title: z.string(),
        details: z.string().optional(),
        link: z.string().optional(),
        dueDate: z.date().optional(),
        attachmentType: z.enum(["ASSIGNMENT", "GITHUB", "ZOOM", "OTHERS"]),
        courseId: z.string(),
        classId: z.string(),
        maxSubmissions: z.number().optional(),
        submissionMode: z.enum(["HTML_CSS_JS", "REACT", "EXTERNAL_LINK"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [attachment] = await ctx.db.insert(attachments).values({
        title: input.title,
        classId: input.classId,
        link: input.link,
        details: input.details,
        attachmentType: input.attachmentType,
        submissionMode: input.submissionMode,
        dueDate: input.dueDate,
        courseId: input.courseId,
        maxSubmissions: input.maxSubmissions,
      }).returning();

      return attachment;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [attachment] = await ctx.db
        .select()
        .from(attachments)
        .where(eq(attachments.id, input.id));

      return attachment;
    }),

  delete: instructorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(attachments)
        .where(eq(attachments.id, input.id))
        .returning();

      return deleted;
    }),

  update: instructorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        details: z.string().optional(),
        link: z.string().optional(),
        dueDate: z.date().optional(),
        attachmentType: z.enum(["ASSIGNMENT", "GITHUB", "ZOOM", "OTHERS"]),
        courseId: z.string(),
        classId: z.string(),
        maxSubmissions: z.number().optional(),
        submissionMode: z.enum(["HTML_CSS_JS", "REACT", "EXTERNAL_LINK"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(attachments)
        .set({
          title: input.title,
          classId: input.classId,
          link: input.link,
          details: input.details,
          attachmentType: input.attachmentType,
          submissionMode: input.submissionMode,
          dueDate: input.dueDate,
          courseId: input.courseId,
          maxSubmissions: input.maxSubmissions,
        })
        .where(eq(attachments.id, input.id))
        .returning();

      return updated;
    }),
}); 