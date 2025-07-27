import { zodResolver } from "@hookform/resolvers/zod";
import { Account } from "@prisma/client";
import { actions } from "astro:actions";
import { CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const SandboxIntegration = ({ sandbox }: { sandbox?: Account | undefined }) => {
  const formSchema = z.object({
    apiKey: z.string().min(1, "API key is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { apiKey: sandbox?.access_token || "" },
  });

  const [checking, setChecking] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [results, setResults] = useState<{
    create: { ok: boolean | null | "skipped"; error?: string } | null;
    read: { ok: boolean | null | "skipped"; error?: string } | null;
    edit: { ok: boolean | null | "skipped"; error?: string } | null;
    vmManage: { ok: boolean | null | "skipped"; error?: string } | null;
  }>({
    create: null,
    read: null,
    edit: null,
    vmManage: null,
  });
  const [editMode, setEditMode] = useState(!sandbox);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleEdit() {
    setEditMode(true);
    form.setValue("apiKey", "");
  }

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  async function onValidate(values: z.infer<typeof formSchema>) {
    setChecking(true);
    setShowChecks(true);
    setResults({ create: null, read: null, edit: null, vmManage: null });

    try {
      // Step 1: Create sandbox
      setResults((prev) => ({ ...prev, create: { ok: null } }));
      const createResult = await actions.sandbox_createSandbox({ apiKey: values.apiKey });
      if (createResult?.data?.ok && createResult.data.sandboxId) {
        setResults((prev) => ({ ...prev, create: { ok: true } }));
        const sandboxId = createResult.data.sandboxId;

        // Step 2: Check read permission
        setResults((prev) => ({ ...prev, read: { ok: null } }));
        const readResult = await actions.sandbox_checkReadPermission({ apiKey: values.apiKey });
        if (readResult?.data?.ok) {
          setResults((prev) => ({ ...prev, read: { ok: true } }));

          // Step 3: Check edit permission
          setResults((prev) => ({ ...prev, edit: { ok: null } }));
          const editResult = await actions.sandbox_checkEditPermission({
            apiKey: values.apiKey,
            sandboxId,
          });
          if (editResult?.data?.ok) {
            setResults((prev) => ({ ...prev, edit: { ok: true } }));

            // Step 4: Check VM manage permission
            setResults((prev) => ({ ...prev, vmManage: { ok: null } }));
            const vmResult = await actions.sandbox_checkVMManagePermission({
              apiKey: values.apiKey,
              sandboxId,
            });
            if (vmResult?.data?.ok) {
              setResults((prev) => ({ ...prev, vmManage: { ok: true } }));

              // All checks passed - save the account
              try {
                const saveResult = await actions.sandbox_saveCodesandboxAccount({
                  apiKey: values.apiKey,
                });
                if (saveResult?.data?.ok) {
                  toast.success(
                    "API key is valid, has all required permissions, and is now saved!"
                  );
                  setEditMode(false);
                } else {
                  toast.error("API key validated but failed to save in database.");
                }
              } catch (e) {
                toast.error("API key validated but error saving in database.");
              }

              // Cleanup the test sandbox
              try {
                await actions.sandbox_cleanupTestSandbox({ apiKey: values.apiKey, sandboxId });
              } catch (e) {
                // Ignore cleanup errors
              }

              setChecking(false);
              return;
            } else {
              setResults((prev) => ({
                ...prev,
                vmManage: {
                  ok: false,
                  error: vmResult?.data?.error || "VM Manage failed",
                },
              }));
              toast.error(vmResult?.data?.error || "VM Manage permission check failed.");
            }
          } else {
            setResults((prev) => ({
              ...prev,
              edit: {
                ok: false,
                error: editResult?.data?.error || "Edit failed",
              },
              vmManage: { ok: "skipped" },
            }));
            toast.error(editResult?.data?.error || "Edit permission check failed.");
          }
        } else {
          setResults((prev) => ({
            ...prev,
            read: {
              ok: false,
              error: readResult?.data?.error || "Read failed",
            },
            edit: { ok: "skipped" },
            vmManage: { ok: "skipped" },
          }));
          toast.error(readResult?.data?.error || "Read permission check failed.");
        }

        // Cleanup the test sandbox
        try {
          await actions.sandbox_cleanupTestSandbox({ apiKey: values.apiKey, sandboxId });
        } catch (e) {
          // Ignore cleanup errors
        }
      } else {
        setResults((prev) => ({
          ...prev,
          create: {
            ok: false,
            error: createResult?.data?.error || "Creation failed",
          },
          read: { ok: "skipped" },
          edit: { ok: "skipped" },
          vmManage: { ok: "skipped" },
        }));
        toast.error(createResult?.data?.error || "Sandbox creation failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during validation.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="codesandbox">
        <AccordionTrigger className="flex flex-row items-center gap-4 p-4">
          <div className="flex flex-row items-center gap-4">
            <img src="/integrations/codesandbox.png" alt="Codesandbox" className="w-7 h-7" />
            <span className="text-lg font-semibold">Codesandbox</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="flex flex-col gap-2">
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded mb-4">
              <strong className="block mb-2">How to set up CodeSandbox Integration:</strong>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Create or log into your{" "}
                  <a
                    href="https://codesandbox.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-orange-700"
                  >
                    CodeSandbox account
                  </a>
                  .
                </li>
                <li>
                  Create an API key at{" "}
                  <a
                    href="https://codesandbox.io/t/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-orange-700"
                  >
                    codesandbox.io/t/api
                  </a>{" "}
                  (enable all scopes).
                </li>
                <li>Click on validate button to validate the API key.</li>
              </ol>
            </div>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onValidate)}
              className="flex flex-col gap-2"
              autoComplete="off"
            >
              <div className="flex flex-row items-center gap-2">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Enter Codesandbox API Key</FormLabel>
                      <FormControl>
                        <Input
                          id="codesandbox-api-key"
                          type="text"
                          placeholder="API Key"
                          className="w-full"
                          {...field}
                          disabled={!editMode || checking}
                          ref={inputRef}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(!sandbox || editMode) && (
                  <Button
                    type="submit"
                    className="shrink-0 mt-auto"
                    disabled={checking || !editMode}
                  >
                    {checking ? <Loader2 className="animate-spin w-4 h-4" /> : "Validate"}
                  </Button>
                )}

                {sandbox && !editMode && (
                  <div className="flex flex-row items-center gap-2 mt-auto">
                    <div className="flex-1" />
                    <Button type="button" className="shrink-0 mt-auto" onClick={handleEdit}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </Form>
          {showChecks && editMode && (
            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="bg-transparent rounded-lg p-6 w-full max-w-sm flex flex-col gap-4 border">
                <h4 className="text-center text-base font-semibold mb-2">Preflight Checks</h4>
                <PermissionCheck label="Sandbox Creation" result={results.create} />
                <PermissionCheck label="Sandbox Read" result={results.read} />
                <PermissionCheck label="Sandbox Edit" result={results.edit} />
                <PermissionCheck label="VM Manage" result={results.vmManage} />
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

function PermissionCheck({
  label,
  result,
}: {
  label: string;
  result: { ok: boolean | null | "skipped"; error?: string } | null;
}) {
  let icon = <Loader2 className="animate-spin w-4 h-4 text-gray-400" />;
  let errorMsg = "";

  if (result && result.ok === true) {
    icon = <CheckCircle2 className="text-green-600 w-4 h-4" />;
  } else if (result && result.ok === false) {
    icon = <XCircle className="text-red-600 w-4 h-4" />;
    errorMsg = result.error || "";
  } else if (result && result.ok === "skipped") {
    icon = <SkipForward className="w-4 h-4 text-gray-400" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
      {errorMsg && <span className="text-xs text-red-500 ml-2">{errorMsg}</span>}
      {result?.ok === "skipped" && <span className="text-xs text-gray-500 ml-2">Skipped</span>}
    </div>
  );
}
