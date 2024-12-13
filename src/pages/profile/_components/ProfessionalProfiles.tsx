import { zodResolver } from "@hookform/resolvers/zod";
import type { Profile } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
// import { validatePlatformHandles } from "@/actions/codingPlatforms";
import { toast } from "react-hot-toast";
import {
  RiCodeBoxLine,
  RiCodeLine,
  RiCodeSSlashLine,
  RiGithubLine,
  RiTerminalBoxLine,
} from "react-icons/ri";
import * as z from "zod";

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

const formSchema = z.object({
  github: z
    .string()
    .refine(
      (val) => !val.includes("/") && !val.includes("github.com"),
      "Please enter only username"
    )
    .optional()
    .or(z.literal("")),
  leetcode: z
    .string()
    .refine(
      (val) => !val.includes("/") && !val.includes("leetcode.com"),
      "Please enter only username"
    )
    .optional()
    .or(z.literal("")),
  codechef: z
    .string()
    .refine(
      (val) => !val.includes("/") && !val.includes("codechef.com"),
      "Please enter only username"
    )
    .optional()
    .or(z.literal("")),
  codeforces: z
    .string()
    .refine(
      (val) => !val.includes("/") && !val.includes("codeforces.com"),
      "Please enter only username"
    )
    .optional()
    .or(z.literal("")),
  hackerrank: z
    .string()
    .refine(
      (val) => !val.includes("/") && !val.includes("hackerrank.com"),
      "Please enter only username"
    )
    .optional()
    .or(z.literal("")),
});

interface ProfessionalProfilesProps {
  professionalProfiles: Record<string, string>;
  onUpdate: (profile: Partial<Profile>) => Promise<void>;
}

export default function ProfessionalProfiles({
  professionalProfiles,
  onUpdate,
}: ProfessionalProfilesProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      github: professionalProfiles?.github || "",
      leetcode: professionalProfiles?.leetcode || "",
      codechef: professionalProfiles?.codechef || "",
      codeforces: professionalProfiles?.codeforces || "",
      hackerrank: professionalProfiles?.hackerrank || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // const validationValues = Object.fromEntries(
      //   Object.entries(values).filter(([_, value]) => value !== "" && value !== undefined)
      // );
      // toast.loading("Validating handles...");
      // const { valid, invalidFields } = await validatePlatformHandles(validationValues as Record<string, string>);
      // if (!valid) {
      //   toast.dismiss();
      //   toast.error(`Invalid handles: ${invalidFields.join(", ")}`);
      //   return;
      // }
      toast.dismiss();
      await onUpdate({
        professionalProfiles: values,
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Professional Profiles</h2>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <RiGithubLine className="h-5 w-5" />
                    GitHub Username
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leetcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <RiCodeBoxLine className="h-5 w-5" />
                    LeetCode Username
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codechef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <RiCodeSSlashLine className="h-5 w-5" />
                    CodeChef Username
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codeforces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <RiTerminalBoxLine className="h-5 w-5" />
                    Codeforces Username
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hackerrank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <RiCodeLine className="h-5 w-5" />
                    HackerRank Username
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isEditing && (
            <Button type="submit" className="w-full md:w-auto">
              Save Changes
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
