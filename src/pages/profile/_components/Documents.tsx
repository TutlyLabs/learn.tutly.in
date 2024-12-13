import { zodResolver } from "@hookform/resolvers/zod";
import type { Profile } from "@prisma/client";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  resume: z.string().optional(),
});

interface DocumentsProps {
  documents: Record<string, string>;
  onUpdate: (profile: Partial<Profile>) => Promise<void>;
}

export default function Documents({ documents, onUpdate }: DocumentsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resume: documents?.resume || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onUpdate({
        documents: values,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center py-4">
        <h2 className="text-2xl font-semibold">Documents</h2>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="h-10"
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <FormField
              control={form.control}
              name="resume"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">Resume</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-6 min-h-[100px] p-6 border rounded-lg">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file.name);
                          }
                        }}
                        disabled={!isEditing}
                        className="h-18 p-2 file:mr-6 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {field.value && (
                        <a
                          href="#"
                          className="text-blue-500 hover:underline text-lg"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Current Resume
                        </a>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isEditing && (
            <Button type="submit" className="w-full md:w-auto h-12 text-lg">
              <Upload className="h-5 w-5 mr-3" />
              Upload Documents
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
