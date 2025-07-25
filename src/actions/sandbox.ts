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

export const checkAllPermissions = defineAction({
  input: z.object({ apiKey: z.string() }),
  async handler({ apiKey }) {
    let sdk, sandboxId;
    const results: Record<
      "create" | "read" | "edit" | "vmManage",
      { ok: boolean; error?: string }
    > = {
      create: { ok: false },
      read: { ok: false },
      edit: { ok: false },
      vmManage: { ok: false },
    };
    try {
      // Create one sandbox for all checks
      try {
        ({ sdk, sandboxId } = await createTestSandbox(apiKey));
        results.create.ok = true;
      } catch (error) {
        results.create = {
          ok: false,
          error: `Sandbox Creation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        return { results };
      }
      // Check read
      try {
        await sdk.sandboxes.list();
        results.read.ok = true;
      } catch (error) {
        results.read = {
          ok: false,
          error: `Sandbox Read failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        return { results };
      }
      // Check edit
      try {
        const sandbox = await sdk.sandboxes.resume(sandboxId);
        const client = await sandbox.connect();
        await client.fs.writeTextFile("/README.md", "# Permission check");
        results.edit.ok = true;
      } catch (error) {
        results.edit = {
          ok: false,
          error: `Sandbox Edit failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        return { results };
      }
      // Check VM manage
      try {
        await sdk.sandboxes.restart(sandboxId);
        results.vmManage.ok = true;
      } catch (error) {
        results.vmManage = {
          ok: false,
          error: `VM Manage failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        return { results };
      }
      return { results };
    } finally {
      if (sdk && sandboxId) {
        await cleanupSandbox(sdk, sandboxId);
      }
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
