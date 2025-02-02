import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        organization: true,
        adminForCourses: true,
      },
      omit: {
        password: true,
        oneTimePassword: true,
      },
    });
    return user;
  }),

  getAllEnrolledUsers: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrolledUsers = await ctx.db.user.findMany({
        where: {
          role: "STUDENT",
          organizationId: ctx.user.organizationId,
          enrolledUsers: {
            some: {
              courseId: input.courseId,
            },
          },
        },
        select: {
          id: true,
          image: true,
          username: true,
          name: true,
          email: true,
        },
      });

      return enrolledUsers;
    }),

  getAllUsers: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const globalUsers = await ctx.db.user.findMany({
        where: {
          organizationId: ctx.user.organizationId,
        },
        select: {
          id: true,
          image: true,
          username: true,
          name: true,
          email: true,
          role: true,
          enrolledUsers: {
            where: {
              courseId: input.courseId,
            },
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
              mentorUsername: true,
            },
          },
        },
      });
      return globalUsers;
    }),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        profile: z
          .object({
            mobile: z.string(),
            whatsapp: z.string(),
            gender: z.string(),
            tshirtSize: z.string(),
            secondaryEmail: z.string(),
            dateOfBirth: z
              .union([z.date(), z.string()])
              .transform((val) => (typeof val === "string" ? new Date(val) : val))
              .nullable(),
            hobbies: z.array(z.string()),
            aboutMe: z.string(),
            socialLinks: z.record(z.string()),
            professionalProfiles: z.record(z.string()),
            academicDetails: z.record(z.string()),
            experiences: z.array(z.record(z.any())),
            address: z.record(z.string()),
            documents: z.record(z.string()),
          })
          .partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const defaultValues = {
        userId: ctx.user.id,
        mobile: null,
        whatsapp: null,
        gender: null,
        tshirtSize: null,
        secondaryEmail: null,
        dateOfBirth: null,
        hobbies: [],
        aboutMe: null,
        socialLinks: {},
        professionalProfiles: {},
        academicDetails: {},
        experiences: [],
        address: {},
        documents: {},
      };

      const createData = {
        ...defaultValues,
        ...Object.fromEntries(
          Object.entries(input.profile).map(([key, value]) => [
            key,
            value ?? defaultValues[key as keyof typeof defaultValues],
          ])
        ),
      };

      const updateData = Object.fromEntries(
        Object.entries(input.profile)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, value])
      );

      const updatedProfile = await ctx.db.profile.upsert({
        where: { userId: ctx.user.id },
        create: createData,
        update: updateData,
      });

      return updatedProfile;
    }),

  updateUserAvatar: protectedProcedure
    .input(z.object({ avatar: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updatedProfile = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { image: input.avatar },
      });

      return updatedProfile;
    }),

  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        username: z.string(),
        email: z.string(),
        password: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.organizationId) {
        throw new Error("Organization not found");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          password: hashedPassword,
          role: input.role as Role,
          organization: { connect: { id: ctx.user.organizationId } },
        },
      });

      return user;
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        username: z.string(),
        email: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.organizationId) {
        throw new Error("Organization not found");
      }

      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          role: input.role as Role,
        },
      });
      return user;
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getUser: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }),

  bulkUpsert: protectedProcedure
    .input(
      z.array(
        z.object({
          name: z.string(),
          username: z.string(),
          email: z.string(),
          password: z.string().optional(),
          role: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input: users }) => {
      if (!ctx.user.organizationId) {
        throw new Error("Organization not found");
      }

      const results = await Promise.all(
        users.map(async (user) => {
          const existingUser = await ctx.db.user.findFirst({
            where: {
              email: user.email,
              organizationId: ctx.user.organizationId,
            },
          });

          const hashedPassword = user.password ? await bcrypt.hash(user.password, 10) : null;

          if (existingUser) {
            return ctx.db.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                username: user.username,
                password: hashedPassword,
                role: user.role as Role,
              },
            });
          }

          return ctx.db.user.create({
            data: {
              ...user,
              password: hashedPassword,
              organization: {
                connect: { id: ctx.user.organizationId! },
              },
              role: user.role as Role,
            },
          });
        })
      );

      return results;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        old_password: z.string().optional(),
        new_password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          password: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.password && !input.old_password) {
        throw new Error("Old password is required");
      }

      if (user.password && input.old_password) {
        const passwordMatch = await bcrypt.compare(input.old_password, user.password);

        if (!passwordMatch) {
          throw new Error("Old password is incorrect");
        }
      }

      const hashedNewPassword = await bcrypt.hash(input.new_password, 10);

      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          password: hashedNewPassword,
        },
      });

      return { success: true };
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findUnique({
        where: {
          id: input.sessionId,
          userId: ctx.user.id,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (ctx.session?.id === input.sessionId) {
        throw new Error("Cannot delete current session");
      }

      await ctx.db.session.delete({
        where: {
          id: input.sessionId,
          userId: ctx.user.id,
        },
      });

      return { success: true };
    }),

  unlinkAccount: protectedProcedure
    .input(z.object({ provider: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.account.findUnique({
        where: {
          userId: ctx.user.id,
          provider: input.provider,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      const accountCount = await ctx.db.account.count({
        where: {
          userId: ctx.user.id,
        },
      });

      if (accountCount <= 1) {
        throw new Error("Cannot unlink last account");
      }

      await ctx.db.account.delete({
        where: {
          userId: ctx.user.id,
          provider: input.provider,
        },
      });

      return { success: true };
    }),

  resetPassword: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          password: null,
        },
      });

      return user;
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        oldPassword: z.string().optional(),
        newPassword: z
          .string()
          .min(1, "Password is required")
          .min(8, "Password must have than 8 characters"),
        confirmPassword: z
          .string()
          .min(1, "Password is required")
          .min(8, "Password must have than 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.newPassword !== input.confirmPassword) {
        return {
          error: {
            message: "Passwords don't match",
          },
        };
      }

      const userExists = await ctx.db.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          password: true,
        },
      });

      if (!userExists) {
        return {
          error: {
            message: "User does not exist",
          },
        };
      }

      if (userExists.password !== null) {
        if (!input.oldPassword) {
          return {
            error: {
              message: "Please provide old password",
            },
          };
        }

        const isPasswordValid = await bcrypt.compare(input.oldPassword, userExists.password);
        if (!isPasswordValid) {
          return {
            error: {
              message: "Old password is incorrect",
            },
          };
        }
      }

      const password = await bcrypt.hash(input.newPassword, 10);

      await ctx.db.user.update({
        where: {
          email: input.email,
        },
        data: {
          password: password,
        },
      });

      return {
        success: true,
        message: "User updated successfully",
      };
    }),

  instructor_resetPassword: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "INSTRUCTOR") {
        return {
          error: {
            message: "Unauthorized",
          },
        };
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      await ctx.db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: "Password reset successfully",
      };
    }),

  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    return sessions;
  }),
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db.account.findMany({
      where: { userId: ctx.user.id },
    });

    return accounts;
  }),

    getStudentsOfMentor: protectedProcedure.query(async ({ ctx }) => {
      const currentUser=ctx.user;
      const students = await ctx.db.user.findMany({
        where: {
          role: "STUDENT",
          organizationId: currentUser.organizationId,
          ...(currentUser.role === "MENTOR" && {
            enrolledUsers: {
              some: {
                mentorUsername: currentUser.username,
              },
            },
          }),
        },
        include: {
          course: true,
          enrolledUsers: true,
        },
      });
      return students;
    }),
});
