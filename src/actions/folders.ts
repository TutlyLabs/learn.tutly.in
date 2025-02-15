import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const updateFolder = defineAction({
  input: z.object({
    id: z.string(),
    title: z.string(),
  }),
  async handler({ id, title }) {
    try {
      const updatedFolder = await db.folder.update({
        where: { id },
        data: { title },
      });
      return { success: true, data: updatedFolder };
    } catch (error) {
      console.error("Error updating folder:", error);
      return { error: "Failed to update folder" };
    }
  },
});
