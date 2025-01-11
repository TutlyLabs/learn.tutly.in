import { z } from "zod";

export const idSchema = z.object({
  id: z.string(),
});

export const courseIdSchema = z.object({
  courseId: z.string(),
});

export const userIdSchema = z.object({
  userId: z.string(),
});

export const mentorSchema = z.object({
  mentorUsername: z.string(),
});
