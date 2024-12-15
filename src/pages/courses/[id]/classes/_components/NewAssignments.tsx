import { zodResolver } from "@hookform/resolvers/zod";
import { Attachment, FileType, attachmentType, submissionMode } from "@prisma/client";
import { actions } from "astro:actions";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

import RichTextEditor from "@/components/editor/RichTextEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/hooks/use-router";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  link: z.string().optional(),
  attachmentType: z.string().min(1, {
    message: "Type is required",
  }),
  class: z.string().min(1, {
    message: "class is required",
  }),
  submissionMode: z.string().min(1, {
    message: "Submission mode is required",
  }),
  courseId: z.string().optional(),
  details: z.string().optional(),
  dueDate: z.string().optional(),
  maxSubmissions: z.string().optional(),
});

interface NewAttachmentPageProps {
  classes: any;
  courseId: string;
  classId: string;
  isEditing?: boolean;
  attachment?: Attachment;
  onComplete?: () => void;
}

const NewAttachmentPage = ({
  classes,
  courseId,
  classId,
  isEditing = false,
  attachment,
  onComplete,
}: NewAttachmentPageProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: attachment?.title || "",
      link: attachment?.link || "",
      attachmentType: attachment?.attachmentType || "ASSIGNMENT",
      submissionMode: attachment?.submissionMode || "",
      class: classId || attachment?.classId || "",
      courseId: courseId || "",
      details: attachment?.details || "",
      dueDate: attachment?.dueDate ? new Date(attachment.dueDate).toISOString().split("T")[0] : "",
      maxSubmissions: attachment?.maxSubmissions?.toString() || "1",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dueDate =
      values?.dueDate !== "" && values?.dueDate ? new Date(values?.dueDate) : undefined;

    values.title = values.title.trim();

    try {
      if (isEditing && attachment) {
        const res = await actions.attachments_updateAttachment({
          id: attachment.id,
          title: values.title,
          classId: values.class,
          link: values.link,
          attachmentType: values.attachmentType as attachmentType,
          submissionMode: values.submissionMode as submissionMode,
          details: values.details,
          dueDate: dueDate || undefined,
          maxSubmissions: values?.maxSubmissions ? parseInt(values.maxSubmissions) : 1,
          courseId: courseId!,
        });

        if (!res) throw new Error();
        toast.success("Assignment updated");
      } else {
        const res = await actions.attachments_createAttachment({
          title: values.title,
          classId: values.class,
          link: values.link,
          attachmentType: values.attachmentType as attachmentType,
          submissionMode: values.submissionMode as submissionMode,
          details: values.details,
          dueDate: dueDate || undefined,
          maxSubmissions: values?.maxSubmissions ? parseInt(values.maxSubmissions) : 1,
          courseId: courseId!,
        });

        if (!res) throw new Error();
        toast.success("Assignment created");
      }

      if (onComplete) {
        onComplete();
      } else {
        router.push(`/courses/${courseId}/classes/${classId}`);
      }
    } catch (error) {
      toast.error(isEditing ? "Failed to update assignment" : "Failed to create assignment");
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            name="title"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base" htmlFor="title">
                  Title
                </FormLabel>
                <FormControl>
                  <Input
                    className="text-base"
                    disabled={isSubmitting}
                    placeholder="eg., Assignment 1"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attachmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Attachment type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-base" placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-secondary-700 bg-background text-base text-white">
                    <SelectItem className="text-base hover:bg-secondary-800" value="ASSIGNMENT">
                      Assignment
                    </SelectItem>
                    <SelectItem className="text-base hover:bg-secondary-800" value="ZOOM">
                      Zoom
                    </SelectItem>
                    <SelectItem className="text-base hover:bg-secondary-800" value="GITHUB">
                      Github
                    </SelectItem>
                    <SelectItem className="text-base hover:bg-secondary-800" value="OTHERS">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
          <FormField
            name="maxSubmissions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Max Submissions</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="text-base"
                    min="0"
                    disabled={isSubmitting}
                    placeholder="eg., max Submissions..."
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submissionMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Submission Mode</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-base" placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-secondary-700 bg-background text-base text-white">
                    <SelectItem className="text-base hover:bg-secondary-800" value="HTML_CSS_JS">
                      HTML CSS JS
                    </SelectItem>
                    {/* todo: add react */}
                    {/* <SelectItem className="text-base hover:bg-secondary-800" value="REACT">
                      REACT
                    </SelectItem> */}
                    <SelectItem className="text-base hover:bg-secondary-800" value="EXTERNAL_LINK">
                      EXTERNAL LINK
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
          <FormField
            name="dueDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">
                  Due Date <span className="text-sm opacity-80">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input className="text-base" disabled={isSubmitting} type="date" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Assign a class</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-base" placeholder="Select a class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-secondary-700 bg-background text-base text-white">
                    {classes.map((c: any) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-base hover:bg-secondary-800"
                      >
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="font-bold text-red-700" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="link"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Link</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  disabled={isSubmitting}
                  placeholder="Paste Link here..."
                  {...field}
                />
              </FormControl>
              <FormMessage className="font-bold text-red-700" />
            </FormItem>
          )}
        />
        <FormField
          name="details"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Details</FormLabel>
              <FormControl>
                <RichTextEditor
                  initialValue={field.value || ""}
                  onChange={(value) => field.onChange(value || "")}
                  allowUpload={true}
                  fileUploadOptions={{
                    fileType: FileType.ATTACHMENT,
                    associatingId: attachment?.id || "",
                    allowedExtensions: ["jpeg", "jpg", "png", "gif", "svg", "webp"],
                    onUpload: async (file) => {
                      await actions.fileupload_updateAssociatingId({
                        fileId: file.id,
                        associatingId: attachment?.id || "",
                      });
                    },
                  }}
                />
              </FormControl>
              <FormMessage className="font-bold text-red-700" />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-x-3">
          <Button
            className="bg-red-700 hover:bg-red-800"
            onClick={() => {
              router.push(`/courses/${courseId}/classes/${classId}`);
            }}
            variant="destructive"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gray-600 hover:bg-gray-700">
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewAttachmentPage;
