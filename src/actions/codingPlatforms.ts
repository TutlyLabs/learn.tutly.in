import { defineAction } from "astro:actions";
import { z } from "zod";

import { getPlatformScores, validatePlatformHandles } from "@/coding-platforms";

export const validatePlatformHandlesAction = defineAction({
  input: z.object({
    handles: z.record(z.string(), z.string()),
  }),
  handler: async ({ handles }) => {
    return await validatePlatformHandles(handles);
  },
});

export const getPlatformScoresAction = defineAction({
  input: z.object({
    handles: z.record(z.string(), z.string()),
  }),
  handler: async ({ handles }) => {
    return await getPlatformScores(handles);
  },
});
