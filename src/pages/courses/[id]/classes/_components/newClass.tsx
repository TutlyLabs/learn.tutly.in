import { actions } from "astro:actions";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NewClassDialog = ({ courseId }: { courseId: string }) => {
  // const [videoLink, setVideoLink] = useState("");
  const [videoType, setVideoType] = useState("DRIVE");
  const [classTitle, setClassTitle] = useState("");
  const [textValue, setTextValue] = useState("Create Class");
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split("T")[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const { data } = await actions.courses_foldersByCourseId({
          id: courseId!,
        });
        // @ts-ignore
        setFolders(data ?? []);
      } catch (error) {
        console.error("Error fetching folders:", error);
        toast.error("Failed to fetch folders");
      }
    };

    fetchFolders();
  }, [courseId]);

  const handleVideoUpload = async () => {
    if (!videoFile) return;
    toast.loading("Uploading video...");
    setIsUploading(true);
    console.log("Uploading video...");

    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("courseId", courseId!);
      formData.append("classTitle", classTitle);

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Video upload failed");
      }

      const result = await response.json();
      toast.dismiss();
      toast.success("Video uploaded and processed successfully");

      setVideoUrl(result.videoUrl);
      return result.videoUrl;
    } catch (error) {
      toast.dismiss();
      toast.error("Video upload failed: " + (error as Error).message);
      console.error(error);
    } finally {
      setIsUploading(false);
      toast.dismiss();
    }
  };

  const handleCreateClass = async () => {
    setTextValue("Creating Class");
    try {
      const { data, error } = await actions.classes_createClass({
        classTitle,
        videoLink: videoUrl,
        videoType: videoType as "DRIVE" | "ZOOM" | "YOUTUBE",
        courseId: courseId!,
        createdAt,
        folderId: selectedFolder != "new" ? selectedFolder : undefined,
        folderName: selectedFolder == "new" ? folderName.trim() : undefined,
      });

      if (error) {
        toast.error("Failed to add new class");
      } else {
        toast.success("Class added successfully");
        setVideoUrl("");
        setClassTitle("");
        setSelectedFolder("");
        setFolderName("");
        setIsOpen(false);
        window.location.href = `/courses/${courseId}/classes/${data.id}`;
      }
    } catch (error) {
      toast.error("Failed to add new class");
    } finally {
      setTextValue("Create Class");
      window.location.reload();
    }
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
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => {
              setVideoFile(e.target.files?.[0] ?? null);
              handleVideoUpload();
            }}
            disabled={isUploading || classTitle.trim() === ""}
          />

          {isUploading && (
            <div className="text-sm text-gray-500 ml-2">Uploading and processing video...</div>
          )}
          {videoUrl && (
            <div className="text-sm text-gray-500 ml-2">Video uploaded successfully ✅</div>
          )}

          <Input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />

          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger>
              <SelectValue placeholder="Select Folder (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Folder</SelectItem>
              {folders.map((folder: any) => (
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
            disabled={classTitle.trim() === "" || textValue === "Creating Class" || isUploading}
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
