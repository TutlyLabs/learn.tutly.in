import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const addHoliday = defineAction({
  input: z.object({
    reason: z.string(),
    description: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
  }),
  async handler({ reason, description, startDate, endDate }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) throw new Error("Unauthorized");

    try {
      const holiday = await db.holidays.create({
        data: {
          reason,
          description: description ?? null,
          startDate,
          endDate,
        },
      });
      return { success: true, data: holiday };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to add holiday");
    }
  },
});

export const deleteHoliday = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) throw new Error("Unauthorized");

    try {
      const holiday = await db.holidays.delete({
        where: { id },
      });
      return { success: true, data: holiday };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to delete holiday");
    }
  },
});

export const getAllHolidays = defineAction({
  async handler({}, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) throw new Error("Unauthorized");

    try {
      const holidays = await db.holidays.findMany();
      return { success: true, data: holidays };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch holidays");
    }
  },
});
