import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { eventAttachments, scheduleEvents } from "~/server/db/schema";

export const scheduleRouter = createTRPCRouter({
  create: instructorProcedure
    .input(z.object({
      title: z.string(),
      startTime: z.date(),
      endTime: z.date(),
      isPublished: z.boolean(),
      courseId: z.string(),
      attachments: z.array(z.object({
        title: z.string(),
        type: z.enum(["YOUTUBE", "YOUTUBE_LIVE", "GMEET", "JIOMEET", "TEXT", "VIMEO", "VIDEOCRYPT", "DOCUMENT", "OTHER"]),
        details: z.string().optional(),
        link: z.string().optional(),
        ordering: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const [event] = await ctx.db.insert(scheduleEvents).values({
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        isPublished: input.isPublished,
        courseId: input.courseId,
        createdById: ctx.session.user.id,
      }).returning();

      if (!event) {
        throw new Error("Failed to create event");
      }

      if (input.attachments.length > 0) {
        await ctx.db.insert(eventAttachments).values(
          input.attachments.map(attachment => ({
            ...attachment,
            eventId: event.id,
          }))
        );
      }

      return event;
    }),

  update: instructorProcedure
    .input(z.object({
      id: z.string(),
      title: z.string(),
      startTime: z.date(),
      endTime: z.date(),
      isPublished: z.boolean(),
      courseId: z.string(),
      attachments: z.array(z.object({
        id: z.string().optional(),
        title: z.string(),
        type: z.enum(["YOUTUBE", "YOUTUBE_LIVE", "GMEET", "JIOMEET", "TEXT", "VIMEO", "VIDEOCRYPT", "DOCUMENT", "OTHER"]),
        details: z.string().optional(),
        link: z.string().optional(),
        ordering: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(scheduleEvents)
        .set({
          title: input.title,
          startTime: input.startTime,
          endTime: input.endTime,
          isPublished: input.isPublished,
          courseId: input.courseId,
        })
        .where(eq(scheduleEvents.id, input.id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update event");
      }

      // Delete existing attachments
      await ctx.db
        .delete(eventAttachments)
        .where(eq(eventAttachments.eventId, input.id));

      // Create new attachments
      if (input.attachments.length > 0) {
        await ctx.db.insert(eventAttachments).values(
          input.attachments.map(attachment => ({
            title: attachment.title,
            type: attachment.type,
            details: attachment.details,
            link: attachment.link,
            ordering: attachment.ordering,
            eventId: updated.id,
          }))
        );
      }

      return updated;
    }),

  delete: instructorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(scheduleEvents)
        .where(eq(scheduleEvents.id, input.id));

      return { success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.scheduleEvents.findFirst({
        where: eq(scheduleEvents.id, input.id),
        with: {
          attachments: true,
        },
      });

      return event;
    }),

  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.query.scheduleEvents.findMany({
        where: eq(scheduleEvents.courseId, input.courseId),
        with: {
          attachments: true,
        },
        orderBy: (scheduleEvents, { asc }) => [asc(scheduleEvents.startTime)],
      });

      return events;
    }),
}); 