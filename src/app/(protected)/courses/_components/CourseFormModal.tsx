"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

interface CourseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  defaultValues?: {
    id: string;
    title: string;
    isPublished: boolean;
    image?: string;
  };
}

export default function CourseFormModal({
  open,
  onOpenChange,
  mode,
  defaultValues,
}: CourseFormModalProps) {
  const [courseTitle, setCourseTitle] = useState(defaultValues?.title ?? "");
  const [isPublished, setIsPublished] = useState(defaultValues?.isPublished ?? false);
  const [img, setImg] = useState(defaultValues?.image ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const createMutation = api.courses.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New course added successfully",
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.courses.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.courses.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      setShowDeleteAlert(false);
      toast({
        title: "Error",
        description: error.message === "Cannot delete course with enrolled users" 
          ? "Cannot delete course that has enrolled users"
          : "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (mode === "add") {
        await createMutation.mutateAsync({
          title: courseTitle,
          isPublished,
          image: img,
        });
      } else if (defaultValues?.id) {
        await updateMutation.mutateAsync({
          id: defaultValues.id,
          title: courseTitle,
          isPublished,
          image: img,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (defaultValues?.id) {
      await deleteMutation.mutateAsync({
        id: defaultValues.id,
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add New Course" : "Edit Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Enter course title"
              />
            </div>

            <div className="space-y-2">
              <Label>Publish Status</Label>
              <RadioGroup
                value={String(isPublished)}
                onValueChange={(value) => setIsPublished(value === "true")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="yes" />
                  <Label htmlFor="yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="no" />
                  <Label htmlFor="no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={img}
                onChange={(e) => setImg(e.target.value)}
                placeholder="Paste image link here"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={isSubmitting || !courseTitle}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Saving..." : mode === "add" ? "Create" : "Save"}
              </Button>

              {mode === "edit" && (
                <Button variant="destructive" onClick={() => setShowDeleteAlert(true)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course and all its
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
