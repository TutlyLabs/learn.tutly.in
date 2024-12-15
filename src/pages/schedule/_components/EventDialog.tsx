import { zodResolver } from "@hookform/resolvers/zod";
import type { EventAttachment, ScheduleEvent } from "@prisma/client";
import { actions } from "astro:actions";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  courseId: z.string().min(1, "Course is required"),
  isPublished: z.boolean().default(false),
  isAllDay: z.boolean().default(false),
});

type EventWithDetails = ScheduleEvent & {
  attachments: EventAttachment[];
  course: {
    id: string;
    title: string;
  } | null;
};

type EventDialogProps = {
  courses: { id: string; title: string }[];
  event?: EventWithDetails | null;
  onSuccess?: () => void;
};

export default function EventDialog({ courses, event, onSuccess }: EventDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: event
      ? {
          title: event.title,
          startTime: new Date(event.startTime)
            .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
            .slice(0, 16),
          endTime: new Date(event.endTime)
            .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
            .slice(0, 16),
          courseId: event.courseId || "",
          isPublished: event.isPublished,
          isAllDay: false,
        }
      : {
          title: "",
          startTime: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16),
          endTime: new Date(new Date().setHours(new Date().getHours() + 1))
            .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
            .slice(0, 16),
          courseId: "",
          isPublished: false,
          isAllDay: false,
        },
  });

  useEffect(() => {
    const isAllDay = form.watch("isAllDay");
    const startTime = form.watch("startTime");

    if (isAllDay && startTime) {
      const start = new Date(startTime);
      start.setHours(0, 0, 0, 0);
      const end = new Date(startTime);
      end.setHours(23, 59, 59, 999);

      form.setValue(
        "startTime",
        start.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16)
      );
      form.setValue(
        "endTime",
        end.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16)
      );
    }
  }, [form.watch("isAllDay")]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const finalValues = {
        title: values.title,
        courseId: values.courseId,
        isPublished: values.isPublished,
        startTime: values.startTime,
        endTime: values.endTime,
        isAllDay: values.isAllDay,
      };

      if (event) {
        await actions.schedule_updateEvent({
          id: event.id,
          title: finalValues.title,
          startTime: finalValues.startTime,
          endTime: finalValues.endTime,
          isPublished: finalValues.isPublished,
        });
      } else {
        await actions.schedule_createEvent({
          title: finalValues.title,
          startTime: finalValues.startTime,
          endTime: finalValues.endTime,
          courseId: finalValues.courseId,
          isPublished: finalValues.isPublished,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await actions.schedule_deleteEvent({ id: event.id });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={event ? "outline" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {event ? "Edit Event" : "New Event"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>All day</FormLabel>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={form.watch("isAllDay")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={form.watch("isAllDay")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Published</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Make this event visible to students
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              {event && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete Event
                </Button>
              )}
              <Button type="submit">{event ? "Save Changes" : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
