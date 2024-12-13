import { NoteCategory } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const updateNote = defineAction({
  input: z.object({
    category: z.nativeEnum(NoteCategory),
    description: z.string(),
    tags: z.array(z.string()),
    objectId: z.string(),
    causedObjects: z.record(z.string()).optional(),
  }),
  async handler({ category, description, tags, objectId, causedObjects = {} }, { locals }) {
    await db.notes.upsert({
      where: {
        userId_objectId: {
          userId: locals.user?.id!,
          objectId,
        },
      },
      create: {
        category,
        description,
        tags,
        userId: locals.user?.id!,
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
  },
});
