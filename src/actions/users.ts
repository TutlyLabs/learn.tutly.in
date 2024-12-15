import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

export const getCurrentUser = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        image: true,
        username: true,
        name: true,
        email: true,
      },
    });
    return user;
  },
});

export const getAllEnrolledUsers = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }) {
    const enrolledUsers = await db.user.findMany({
      where: {
        role: "STUDENT",
        enrolledUsers: {
          some: {
            courseId: courseId,
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
  },
});

export const getAllUsers = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const globalUsers = await db.user.findMany({
      select: {
        id: true,
        image: true,
        username: true,
        name: true,
        email: true,
        role: true,
        enrolledUsers: {
          where: {
            courseId: courseId,
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
  },
});

export const updateUserProfile = defineAction({
  input: z.object({
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
  }),
  async handler({ profile }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const defaultValues = {
      userId: currentUser.id,
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
        Object.entries(profile).map(([key, value]) => [
          key,
          value ?? defaultValues[key as keyof typeof defaultValues],
        ])
      ),
    };

    const updateData = Object.fromEntries(
      Object.entries(profile)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value])
    );

    const updatedProfile = await db.profile.upsert({
      where: { userId: currentUser.id },
      create: createData,
      update: updateData,
    });

    return updatedProfile;
  },
});

export const updateUserAvatar = defineAction({
  input: z.object({
    avatar: z.string(),
  }),
  async handler({ avatar }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const updatedProfile = await db.user.update({
      where: { id: currentUser.id },
      data: { image: avatar },
    });

    return updatedProfile;
  },
});


export const createUser = defineAction({
  input: z.object({
    name: z.string(),
    username: z.string(),
    email: z.string(), 
    password: z.string(),
    role: z.string(),
  }),
  async handler({ name, username, email, password, role }, { locals }) {
    try {
      if (!locals.organization) {
        throw new ActionError({
          message: "Organization not found",
          code: "NOT_FOUND",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await db.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
          role: role as Role,
          organization: { connect: { id: locals.organization.id } },
        },
      });

      return user;
    } catch (error) {
      throw new ActionError({
        message: "Failed to create user",
        code: "INTERNAL_SERVER_ERROR", 
      });
    }
  },
});

export const updateUser = defineAction({
  input: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
  }),
  async handler({ id, name, username, email, role }, { locals }) {
    try {
      if (!locals.organization) {
        throw new ActionError({
          message: "Organization not found",
          code: "NOT_FOUND",
        });
      }

      const user = await db.user.update({
        where: { id },
        data: {
          name,
          username,
          email,
          role: role as Role,
        },
      });
      return user;
    } catch (error) {
      throw new ActionError({
        message: "Failed to update user",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const deleteUser = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    try {
      await db.user.delete({ where: { id } });
    } catch (error) {
      throw new ActionError({
        message: "Failed to delete user",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const getUser = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    try {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new ActionError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      return user;
    } catch (error) {
      throw new ActionError({
        message: "Failed to get user",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const bulkUpsert = defineAction({
  input: z.array(
    z.object({
      name: z.string(),
      username: z.string(),
      email: z.string(),
      password: z.string().optional(),
      role: z.string(),
    })
  ),
  async handler(users, { locals }) {
    try {
      if (!locals.organization) {
        throw new ActionError({
          message: "Organization not found",
          code: "NOT_FOUND",
        });
      }

      const results = await Promise.all(
        users.map(async (user) => {
          const existingUser = await db.user.findFirst({
            where: {
              email: user.email,
              organizationId: locals.organization!.id,
            },
          });

          const hashedPassword = user.password ? await bcrypt.hash(user.password, 10) : null;

          if (existingUser) {
            return db.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                username: user.username,
                password: hashedPassword,
                role: user.role as Role,
              },
            });
          }

          return db.user.create({
            data: {
              ...user,
              password: hashedPassword,
              organization: {
                connect: { id: locals.organization!.id },
              },
              role: user.role as Role,
            },
          });
        })
      );

      return results;
    } catch (error) {
      throw new ActionError({
        message: "Failed to bulk upsert users",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const changePassword = defineAction({
  input: z.object({
    id: z.string(),
    old_password: z.string().optional(),
    new_password: z.string(),
  }),
  async handler({ id, old_password, new_password }) {
    try {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          password: true,
        },
      });

      if (!user) {
        throw new ActionError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      if (user.password && !old_password) {
        throw new ActionError({
          message: "Old password is required",
          code: "UNAUTHORIZED",
        });
      }

      if (user.password && old_password) {
        const passwordMatch = await bcrypt.compare(old_password, user.password);

        if (!passwordMatch) {
          throw new ActionError({
            message: "Old password is incorrect",
            code: "UNAUTHORIZED",
          });
        }
      }

      const hashedNewPassword = await bcrypt.hash(new_password, 10);

      await db.user.update({
        where: { id },
        data: {
          password: hashedNewPassword,
        },
      });

    } catch (error) {
      throw new ActionError({
        message: "Failed to change password",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});