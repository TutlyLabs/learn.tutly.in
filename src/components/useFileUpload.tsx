import { FileType } from "@prisma/client";
import { actions } from "astro:actions";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";

export type FileUploadOptions = {
  fileType: FileType;
  onUpload?: (file: any) => Promise<void>;
};

export const isPublicFileTypes: FileType[] = [FileType.AVATAR];

export const useFileUpload = (options: FileUploadOptions) => {
  const { fileType, onUpload } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const uploadFile = async (file: File, associatingId?: string) => {
    setIsUploading(true);
    setUploadPercent(0);

    try {
      const { data } = await actions.fileupload_createFileAndGetUploadUrl({
        name: file.name,
        fileType,
        associatingId,
        // TODO: make this dynamic
        isPublic: true,
        mimeType: file.type,
      });

      if (!data) throw new Error("Failed to get upload URL");

      const { signedUrl, file: uploadedFile } = data;

      await axios.put(signedUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadPercent(percent);
          }
        },
      });

      const { data: updatedFile } = await actions.fileupload_markFileUploaded({
        fileId: uploadedFile.id,
      });

      toast.success("File uploaded successfully");
      onUpload && (await onUpload(updatedFile));
      return updatedFile;
    } catch (error) {
      toast.error("Error uploading file");
      return null;
    } finally {
      setIsUploading(false);
      setUploadPercent(null);
    }
  };

  return {
    uploadFile,
    uploadPercent,
    isUploading,
  };
};
