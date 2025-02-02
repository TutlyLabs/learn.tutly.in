import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  getCurrentUserProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      return await ctx.db.user.findUnique({
        where: {
          id: id,
        },
        include: {
          profile: true,
        },
      });
    }),
});
