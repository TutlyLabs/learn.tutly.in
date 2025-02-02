import { NoteCategory } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notesRouter = createTRPCRouter({
  updateNote: protectedProcedure
    .input(
      z.object({
        category: z.nativeEnum(NoteCategory),
        description: z.string(),
        tags: z.array(z.string()),
        objectId: z.string(),
        causedObjects: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { category, description, tags, objectId, causedObjects = {} } = input;

      await ctx.db.notes.upsert({
        where: {
          userId_objectId: {
            userId: ctx.user.id,
            objectId,
          },
        },
        create: {
          category,
          description,
          tags,
          userId: ctx.user.id,
          objectId,
          causedObjects,
        },
        update: {
          description,
          tags,
          causedObjects: causedObjects,
        },
      });

      return { success: true };
    }),

  getNote: protectedProcedure
    .input(
      z.object({
        objectId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.notes.findUnique({
        where: {
          userId_objectId: {
            userId: input.userId,
            objectId: input.objectId,
          },
        },
      });
    }),

  getAllNotes: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notes.findMany({
        where: {
          userId: input.userId,
        },
      });
    }),
});
