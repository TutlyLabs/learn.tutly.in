import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { courses, enrolledUsers, users } from "~/server/db/schema";

export const coursesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.session.user;

    if (currentUser.role === "INSTRUCTOR") {
      return await ctx.db.query.courses.findMany({
        where: eq(courses.createdById, currentUser.id),
        with: {
          classes: true,
        },
      });
    }

    if (currentUser.role === "MENTOR") {
      return await ctx.db.query.courses.findMany({
        where: eq(enrolledUsers.mentorId, currentUser.id),
        with: {
          classes: true,
        },
      });
    }

    return await ctx.db.query.courses.findMany({
      where: eq(enrolledUsers.userId, currentUser.id),
      with: {
        classes: true,
      },
    });
  }),

  create: instructorProcedure
    .input(
      z.object({
        title: z.string(),
        isPublished: z.boolean(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [course] = await ctx.db
        .insert(courses)
        .values({
          title: input.title,
          createdById: ctx.session.user.id,
          isPublished: input.isPublished,
          image: input.image,
        })
        .returning();

      if (!course) {
        throw new Error("Failed to create course");
      }

      await ctx.db.insert(enrolledUsers).values({
        userId: ctx.session.user.id,
        courseId: course.id,
      });

      return course;
    }),

  update: instructorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        isPublished: z.boolean(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(courses)
        .set({
          title: input.title,
          isPublished: input.isPublished,
          image: input.image,
        })
        .where(eq(courses.id, input.id))
        .returning();

      return updated;
    }),

  delete: instructorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(courses)
        .where(
          and(
            eq(courses.id, input.id),
            eq(courses.createdById, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  enrollStudent: instructorProcedure
    .input(
      z.object({
        courseId: z.string(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.username, input.username));

      if (!user) {
        throw new Error("User not found");
      }

      const [enrollment] = await ctx.db
        .insert(enrolledUsers)
        .values({
          userId: user.id,
          courseId: input.courseId,
        })
        .returning();

      return enrollment;
    }),
}); 