import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const unlinkAccount = defineAction({
  input: z.object({ provider: z.string() }),
  async handler({ provider }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    await db.account.deleteMany({
      where: {
        userId: currentUser.id,
        provider,
      },
    });
    return { success: true };
  },
});
