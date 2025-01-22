import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { courses, enrolledUsers, classes, folders, attachments, submissions } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

export const coursesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.session.user;
  
    const enrolledUsersQuery = await ctx.db.query.enrolledUsers.findMany({
      where: eq(enrolledUsers.userId, currentUser.id),
      with: {
        course: {
          with: {
            classes: true,
            createdBy: {
              columns: {
                id: true,
                username: true,
                name: true,
                image: true,
                email: true,
                role: true,
              }
            },
            enrolledUsers: {
              with: {
                user: true
              }
            }
          }
        }
      }
    });

    const enrolledCourses = enrolledUsersQuery.map(enrollment => enrollment.course);

    return enrolledCourses;

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
      const enrolledCount = await ctx.db.query.enrolledUsers.findMany({
        where: eq(enrolledUsers.courseId, input.id),
        columns: {
          courseId: true
        }
      });

      if (enrolledCount.length > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete course with enrolled users",
        });
      }

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
      const [enrollment] = await ctx.db
        .insert(enrolledUsers)
        .values({
          userId: input.username,
          courseId: input.courseId,
        })
        .returning();

      return enrollment;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
        with: {
          classes: {
            with: {
              attachments: {
                where: eq(attachments.attachmentType, "ASSIGNMENT"),
                with: {
                  submissions: {
                    where: eq(submissions.enrolledUserId, ctx.session.user.id)
                  }
                }
              }
            },
            orderBy: (classes, { asc }) => [asc(classes.createdAt)]
          }
        }
      });

      return course;
    }),

  getClassesWithFolders: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const classesWithFolders = await ctx.db.query.classes.findMany({
        where: eq(classes.courseId, input.courseId),
        with: {
          folder: true
        }
      });

      return classesWithFolders;
    }),
}); 