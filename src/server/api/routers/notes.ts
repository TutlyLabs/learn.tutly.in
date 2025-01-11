import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { notes } from "~/server/db/schema";

export const notesRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(z.object({
      category: z.enum(["CLASS", "ASSIGNMENT", "DOUBT"]),
      description: z.string(),
      tags: z.array(z.string()),
      objectId: z.string(),
      causedObjects: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [existingNote] = await ctx.db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, ctx.session.user.id),
            eq(notes.objectId, input.objectId)
          )
        );

      if (existingNote) {
        const [updated] = await ctx.db
          .update(notes)
          .set({
            description: input.description,
            tags: input.tags,
            causedObjects: JSON.stringify(input.causedObjects ?? {}),
          })
          .where(eq(notes.id, existingNote.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(notes)
        .values({
          category: input.category,
          description: input.description,
          tags: input.tags,
          userId: ctx.session.user.id,
          objectId: input.objectId,
          causedObjects: JSON.stringify(input.causedObjects ?? {}),
        })
        .returning();

      return created;
    }),
}); 