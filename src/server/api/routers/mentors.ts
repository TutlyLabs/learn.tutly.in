import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { enrolledUsers, users } from "~/server/db/schema";

export const mentorsRouter = createTRPCRouter({
  getMentors: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mentors = await ctx.db.query.users.findMany({
        where: and(
          eq(users.role, "MENTOR"),
          eq(enrolledUsers.courseId, input.courseId)
        ),
      });

      return mentors;
    }),

  getMentorNameById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [mentor] = await ctx.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.username, input.id));

      return mentor?.name;
    }),
}); 