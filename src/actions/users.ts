import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

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
