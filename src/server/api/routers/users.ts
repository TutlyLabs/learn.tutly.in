import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { users, profiles } from "~/server/db/schema";

export const usersRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.profiles.findFirst({
      where: eq(profiles.userId, ctx.session.user.id),
      with: {
        user: true,
      },
    });

    return profile;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      dateOfBirth: z.date().optional(),
      hobbies: z.array(z.string()).optional(),
      aboutMe: z.string().optional(),
      secondaryEmail: z.string().email().optional(),
      mobile: z.string().optional(),
      whatsapp: z.string().optional(),
      gender: z.string().optional(),
      tshirtSize: z.string().optional(),
      socialLinks: z.record(z.string()).optional(),
      professionalProfiles: z.record(z.string()).optional(),
      academicDetails: z.record(z.string()).optional(),
      experiences: z.array(z.record(z.string())).optional(),
      address: z.record(z.string()).optional(),
      documents: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .update(profiles)
        .set({
          ...input,
          socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : undefined,
          professionalProfiles: input.professionalProfiles ? JSON.stringify(input.professionalProfiles) : undefined,
          academicDetails: input.academicDetails ? JSON.stringify(input.academicDetails) : undefined,
          experiences: input.experiences,
          address: input.address ? JSON.stringify(input.address) : undefined,
          documents: input.documents ? JSON.stringify(input.documents) : undefined,
        })
        .where(eq(profiles.userId, ctx.session.user.id))
        .returning();

      return profile;
    }),

  updateLastSeen: protectedProcedure.mutation(async ({ ctx }) => {
    const [updated] = await ctx.db
      .update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, ctx.session.user.id))
      .returning();

    return updated;
  }),
}); 