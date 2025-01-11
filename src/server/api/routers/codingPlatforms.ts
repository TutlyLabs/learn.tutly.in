import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { profiles } from "~/server/db/schema";
import { getPlatformScores, validatePlatformHandles } from "~/lib/coding-platforms";

export const codingPlatformsRouter = createTRPCRouter({
  validateHandles: protectedProcedure
    .input(z.object({
      handles: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ input }) => {
      return await validatePlatformHandles(input.handles);
    }),

  getScores: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, ctx.session.user.id));

    if (!profile) return null;

    const professionalProfiles = JSON.parse(profile.professionalProfiles as string);
    const { codechef, leetcode, codeforces, hackerrank, interviewbit } = professionalProfiles;

    const platformHandles = Object.fromEntries(
      Object.entries({
        codechef,
        leetcode,
        codeforces,
        hackerrank,
        interviewbit,
      }).filter(([_, value]) => value !== undefined)
    );

    return await getPlatformScores(platformHandles);
  }),
}); 