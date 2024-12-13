import { BookMarkCategory } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const toggleBookmark = defineAction({
  input: z.object({
    category: z.nativeEnum(BookMarkCategory),
    objectId: z.string(),
    causedObjects: z.record(z.string()).optional(),
  }),
  async handler({ category, objectId, causedObjects = {} }, { locals }) {
    const existingBookmark = await db.bookMarks.findFirst({
      where: {
        category,
        objectId,
        userId: locals.user?.id!,
      },
    });

    if (existingBookmark) {
      await db.bookMarks.delete({
        where: {
          id: existingBookmark.id,
        },
      });
    } else {
      await db.bookMarks.create({
        data: {
          category,
          objectId,
          userId: locals.user?.id!,
          causedObjects: causedObjects,
        },
      });
    }

    return { success: true };
  },
});
