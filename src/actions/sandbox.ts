import { CodeSandbox } from "@codesandbox/sdk";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

async function createTestSandbox(apiKey: string) {
  const sdk = new CodeSandbox(apiKey);
  const createdSandbox = await sdk.sandboxes.create();
  return { sdk, sandboxId: createdSandbox.id };
}

async function cleanupSandbox(sdk: any, sandboxId: string) {
  try {
    await sdk.sandboxes.hibernate(sandboxId);
  } catch {}
  try {
    await sdk.sandboxes.shutdown(sandboxId);
  } catch {}
}

export const createSandbox = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }) {
    try {
      const { sdk, sandboxId } = await createTestSandbox(apiKey);
      return {
        ok: true,
        sandboxId,
        sdk: JSON.stringify(sdk),
      };
    } catch (error) {
      return {
        ok: false,
        error: `Sandbox Creation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const checkReadPermission = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }) {
    try {
      const sdk = new CodeSandbox(apiKey);
      await sdk.sandboxes.list();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: `Sandbox Read failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const checkEditPermission = defineAction({
  input: z.object({ apiKey: z.string(), sandboxId: z.string() }),
  async handler({ apiKey, sandboxId }) {
    try {
      const sdk = new CodeSandbox(apiKey);
      const sandbox = await sdk.sandboxes.resume(sandboxId);
      const client = await sandbox.connect();
      await client.fs.writeTextFile("/README.md", "# Permission check");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: `Sandbox Edit failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const checkVMManagePermission = defineAction({
  input: z.object({ apiKey: z.string(), sandboxId: z.string() }),
  async handler({ apiKey, sandboxId }) {
    try {
      const sdk = new CodeSandbox(apiKey);
      await sdk.sandboxes.restart(sandboxId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: `VM Manage failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const cleanupTestSandbox = defineAction({
  input: z.object({ apiKey: z.string(), sandboxId: z.string() }),
  async handler({ apiKey, sandboxId }) {
    try {
      const sdk = new CodeSandbox(apiKey);
      await cleanupSandbox(sdk, sandboxId);
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  },
});

export const saveCodesandboxAccount = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    const provider = "codesandbox";
    const providerAccountId = "codesandbox";
    const data = {
      userId: currentUser.id,
      provider,
      providerAccountId,
      access_token: apiKey,
      scope: "create,read,edit,vmManage",
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

export const createSandboxWithSession = defineAction({
  input: z.object({
    template: z.string(),
    templateName: z.string(),
  }),
  async handler({ template, templateName }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) throw new Error("Not authenticated");

    const account = await db.account.findFirst({
      where: {
        userId: currentUser.id,
        provider: "codesandbox",
      },
    });

    if (!account?.access_token) {
      return {
        ok: false,
        error: "CodeSandbox API key not found. Please set up your CodeSandbox integration first.",
        redirectTo: "/integrations",
      };
    }

    try {
      const sdk = new CodeSandbox(account.access_token);
      const sandbox = await sdk.sandboxes.create({
        id: template,
        title: `${templateName} Playground`,
        privacy: "unlisted",
      });

      return {
        ok: true,
        sandboxId: sandbox.id,
        sandboxUrl: `https://codesandbox.io/s/${sandbox.id}`,
      };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to create sandbox: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
