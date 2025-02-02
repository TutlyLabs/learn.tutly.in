import { zodResolver } from "@hookform/resolvers/zod";
import { File, FileType, type Profile } from "@prisma/client";
import { Loader2, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { useFileUpload } from "@/components/useFileUpload";
import { api } from "@/trpc/react";

const formSchema = z.object({
  resume: z.string().optional(),
});

interface DocumentsProps {
  documents: Record<string, string>;
  onUpdate: (profile: Partial<Profile>) => Promise<void>;
}

export default function Documents({ documents, onUpdate }: DocumentsProps) {
  // const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useFileUpload({
    fileType: FileType.OTHER,
    onUpload: async (file: File) => {
      if (!file || !file.publicUrl) return;
      onUpdate({
        documents: {
          resume: file.publicUrl,
        },
      });
      try {
        window.location.reload();
      } catch (error) {
        toast.error("Failed to upload resume");
      }
    },
  });

  const { data: user } = api.users.getCurrentUser.useQuery();

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const file = e.target.files[0];
      if (!file || !user?.id) return;
      await uploadFile(file, user.id);
      toast.success("Resume uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload resume");
    }
  };

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
                      <div className="relative flex-1">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          ref={fileInputRef}
                          onChange={handleUpload}
                          disabled={!isEditing || isUploading}
                          className="h-18 p-2 file:mr-6 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        )}
                      </div>
                      {field.value && (
                        <a
                          href={field.value}
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
