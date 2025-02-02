import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const holidaysRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        reason: z.string(),
        description: z.string().optional(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      try {
        const holiday = await ctx.db.holidays.create({
          data: {
            reason: input.reason,
            description: input.description ?? null,
            startDate: input.startDate,
            endDate: input.endDate,
          },
        });
        return { success: true, data: holiday };
      } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to add holiday");
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      try {
        const holiday = await ctx.db.holidays.delete({
          where: { id: input.id },
        });
        return { success: true, data: holiday };
      } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to delete holiday");
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user;
    if (!currentUser) throw new Error("Unauthorized");

    try {
      const holidays = await ctx.db.holidays.findMany();
      return { success: true, data: holidays };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch holidays");
    }
  }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
        description: z.string().optional(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user;
      if (!currentUser) throw new Error("Unauthorized");

      try {
        const holiday = await ctx.db.holidays.update({
          where: { id: input.id },
          data: {
            reason: input.reason,
            description: input.description ?? null,
            startDate: input.startDate,
            endDate: input.endDate,
          },
        });
        return { success: true, data: holiday };
      } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to update holiday");
      }
    }),
});
