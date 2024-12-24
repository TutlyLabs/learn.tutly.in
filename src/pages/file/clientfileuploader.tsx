import { useState, useRef } from "react";
import { FaSpinner, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NewClassDialog = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textValue, setTextValue] = useState("Create Class");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleVideoUpload = async () => {
    if (!videoFile) return;
    setIsUploading(true);
    setTextValue("Uploading...");

    const uploadTimeout = setTimeout(() => {
      setIsUploading(false);
      setTextValue("Create Class");
      toast.error("Upload timed out. Please try again.");
    }, 300000); // 5 minutes timeout

    try {
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Video upload failed');
      }

      const result = await response.json();
      toast.success("Video uploaded and processed successfully");
      
      setVideoUrl(result.videoUrl);
      return result.videoUrl;
    } catch (error) {
      toast.error("Video upload failed: " + (error as Error).message);
      console.error(error);
    } finally {
      clearTimeout(uploadTimeout);
      setIsUploading(false);
      setTextValue("Create Class");
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
        disabled={isUploading}
      />

      {isUploading && <div className="text-sm text-gray-500">Uploading and processing video...</div>}

      <Button
        disabled={!videoFile || isUploading}
        className="w-full"
        onClick={handleVideoUpload}
      >
        {textValue}
        {isUploading ? <FaSpinner className="ml-2 animate-spin" /> : <FaPlus className="ml-2" />}
      </Button>

      {videoUrl && (
        <div className="text-sm">
          Video URL: <a href={
            videoUrl
          } target="_blank" rel="noreferrer">
            {videoUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default NewClassDialog;

