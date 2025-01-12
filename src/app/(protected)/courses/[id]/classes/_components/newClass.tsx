"use client";

import { FaPlus } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const NewClassDialog = ({ courseId }: { courseId: string }) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const { data: folders } = api.folders.getByCourseId.useQuery({ courseId });
  
  const { mutate: createClass } = api.classes.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Class added successfully"
      });
      setVideoLink("");
      setClassTitle("");
      setSelectedFolder("");
      setFolderName("");
      setIsOpen(false);
      router.push(`/courses/${courseId}/classes/${data?.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add new class",
        variant: "destructive"
      });
    }
  });

  const [videoLink, setVideoLink] = useState<string>("");
  const [videoType, setVideoType] = useState<string>("DRIVE");
  const [classTitle, setClassTitle] = useState<string>("");
  const [textValue, setTextValue] = useState<string>("Create Class");
  const [folderName, setFolderName] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString().split("T")[0] ?? "");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleCreateClass = () => {
    if (!classTitle.trim()) {
      toast({
        title: "Error",
        description: "Please fill all necessary fields",
        variant: "destructive"
      });
      return;
    }

    createClass({
      classTitle,
      videoLink,
      videoType: videoType as "DRIVE" | "ZOOM" | "YOUTUBE",
      courseId,
      createdAt,
      folderId: selectedFolder != "new" ? selectedFolder : undefined,
      folderName: selectedFolder == "new" ? folderName.trim() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Class</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={videoType} onValueChange={setVideoType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Video Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRIVE">Drive</SelectItem>
              <SelectItem value="YOUTUBE">YouTube</SelectItem>
              <SelectItem value="ZOOM">Zoom</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Enter class title"
            value={classTitle}
            onChange={(e) => setClassTitle(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Enter video link"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
          />

          <Input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />

          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger>
              <SelectValue placeholder="Select Folder (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Folder</SelectItem>
              {folders?.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFolder === "new" && (
            <Input
              type="text"
              placeholder="Enter new folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          )}

          <Button
            disabled={!classTitle || textValue === "Creating Class"}
            className="w-full"
            onClick={handleCreateClass}
          >
            {textValue}
            {textValue === "Creating Class" ? (
              <FaPlus className="ml-2 animate-spin" />
            ) : (
              <FaPlus className="ml-2" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewClassDialog;
