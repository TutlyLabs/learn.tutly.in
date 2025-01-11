import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { notifications } from "~/server/db/schema";

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userNotifications = await ctx.db.query.notifications.findMany({
      where: eq(notifications.intendedForId, ctx.session.user.id),
      with: {
        causedBy: true,
      },
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });

    return userNotifications;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.id, input.id))
        .returning();

      return updated;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.intendedForId, ctx.session.user.id));

    return { success: true };
  }),
}); 