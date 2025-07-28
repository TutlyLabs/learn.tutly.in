import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const validateApiKey = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }) {
    try {
      console.log("apiKey", apiKey);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        return {
          ok: false,
          error: `API key validation failed: ${response.status} ${response.statusText}. ${errorData}`,
        };
      }

      const data = await response.json();

      if (!data.models || !Array.isArray(data.models)) {
        return {
          ok: false,
          error: "API key validation failed: No models found in response",
        };
      }

      const modelNames = data.models
        .map((model: any) => model.name?.replace("models/", "") || model.displayName)
        .filter(Boolean);

      return {
        ok: true,
        modelsCount: data.models.length,
        models: modelNames,
      };
    } catch (error) {
      return {
        ok: false,
        error: `API key validation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const saveGeminiAccount = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const provider = "gemini";
    const providerAccountId = "gemini";
    const data = {
      userId: currentUser.id,
      provider,
      providerAccountId,
      access_token: apiKey,
      scope: "generate",
      type: "api-key",
    };

    await db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: data,
      create: data,
    });

    return { ok: true };
  },
});
