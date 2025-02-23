import { Role } from "@prisma/client";
import { ActionError, defineAction } from "astro:actions";
import bcrypt from "bcrypt";
import { z } from "zod";

import db from "@/lib/db";
import { generateRandomPassword } from "@/lib/db";

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
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;
    const enrolledUsers = await db.user.findMany({
      where: {
        role: "STUDENT",
        organizationId: currentUser.organizationId,
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
      where: {
        organizationId: currentUser.organizationId,
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
          oneTimePassword: generateRandomPassword(8),
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
              oneTimePassword: generateRandomPassword(8),
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

export const deleteSession = defineAction({
  input: z.object({
    sessionId: z.string(),
  }),
  async handler({ sessionId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) {
      throw new ActionError({
        message: "Not authenticated",
        code: "UNAUTHORIZED",
      });
    }

    const session = await db.session.findUnique({
      where: {
        id: sessionId,
        userId: currentUser.id,
      },
    });

    if (!session) {
      throw new ActionError({
        message: "Session not found",
        code: "NOT_FOUND",
      });
    }

    if (locals.session?.id === sessionId) {
      throw new ActionError({
        message: "Cannot delete current session",
        code: "BAD_REQUEST",
      });
    }

    try {
      await db.session.delete({
        where: {
          id: sessionId,
          userId: currentUser.id,
        },
      });
    } catch (error) {
      throw new ActionError({
        message: "Failed to delete session",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const unlinkAccount = defineAction({
  input: z.object({
    provider: z.string(),
  }),
  async handler({ provider }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) {
      throw new ActionError({
        message: "Not authenticated",
        code: "UNAUTHORIZED",
      });
    }

    const account = await db.account.findUnique({
      where: {
        userId: currentUser.id,
        provider,
      },
    });

    if (!account) {
      throw new ActionError({
        message: "Account not found",
        code: "NOT_FOUND",
      });
    }

    const accountCount = await db.account.count({
      where: {
        userId: currentUser.id,
      },
    });

    if (accountCount <= 1) {
      throw new ActionError({
        message: "Cannot unlink last account",
        code: "BAD_REQUEST",
      });
    }

    try {
      await db.account.delete({
        where: {
          userId: currentUser.id,
          provider,
        },
      });
    } catch (error) {
      throw new ActionError({
        message: "Failed to unlink account",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});

export const resetPassword = defineAction({
  input: z.object({
    email: z.string(),
  }),
  async handler({ email }) {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ActionError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        password: null,
      },
    });

    return user;
  },
});

export const updatePassword = defineAction({
  input: z.object({
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
  }),
  async handler({ email, oldPassword, newPassword, confirmPassword }, { locals }) {
    console.log(email, oldPassword, newPassword, confirmPassword);
    const currentUser = locals.user;
    if (!currentUser) {
      return {
        error: {
          message: "Unauthorized",
        },
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        error: {
          message: "Passwords don't match",
        },
      };
    }

    const userExists = await db.user.findUnique({
      where: {
        email: email,
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
      if (!oldPassword) {
        return {
          error: {
            message: "Please provide old password",
          },
        };
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, userExists.password);
      if (!isPasswordValid) {
        return {
          error: {
            message: "Old password is incorrect",
          },
        };
      }
    }

    const password = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: {
        email: email,
      },
      data: {
        password: password,
      },
    });

    return {
      success: true,
      message: "User updated successfully",
    };
  },
});

export const instructor_resetPassword = defineAction({
  input: z.object({
    email: z.string(),
    newPassword: z.string(),
  }),
  async handler({ email, newPassword }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser || currentUser.role !== "INSTRUCTOR") {
      return {
        error: {
          message: "Unauthorized",
        },
      };
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        error: {
          message: "User not found",
        },
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "Password reset successfully",
    };
  },
});

export const changePassword = defineAction({
  input: z.object({
    oldPassword: z.string().optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  }),
  async handler({ oldPassword, password, confirmPassword }, { locals }) {
    const user = locals.user;
    try {
      if (!user) {
        throw new Error("User not found");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          password: true,
        },
      });

      if (!dbUser) {
        throw new Error("User not found");
      }

      if (oldPassword) {
        const isOldPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password!);

        if (!isOldPasswordCorrect) {
          throw new Error("Old password is incorrect");
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await db.session.deleteMany({
        where: {
          userId: user.id,
        },
      });

      locals.session = null;

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error(
        error instanceof Error ? error.message : "An error occurred while changing password"
      );
    }
  },
});
