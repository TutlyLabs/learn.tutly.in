import { FileType } from "@prisma/client";
import { actions } from "astro:actions";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useState } from "react";
import { toast } from "react-hot-toast";

export type FileUploadOptions = {
  fileType: FileType;
  onUpload?: (file: any) => Promise<void>;
  allowedExtensions?: string[];
};

export const isPublicFileTypes: FileType[] = [FileType.AVATAR];

const ExtImage: string[] = ["jpeg", "jpg", "png", "gif", "svg", "bmp", "webp", "jfif"];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]?.toLowerCase()}` : "";
}

export const useFileUpload = (options: FileUploadOptions) => {
  const { fileType, onUpload, allowedExtensions } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const uploadFile = async (file: File, associatingId?: string) => {
    setIsUploading(true);
    setUploadPercent(0);

    try {
      let fileToUpload = file;
      const ext: string = getExtension(file.name) || "";
      const extWithoutDot = ext.slice(1);

      if (allowedExtensions && !allowedExtensions.includes(extWithoutDot.toLowerCase())) {
        throw new Error(`File type not allowed: ${extWithoutDot}`);
      }

      const isImage = ExtImage.includes(extWithoutDot);

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        const compressionOptions = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        };
        fileToUpload = await imageCompression(file, compressionOptions);
      } else if (!isImage && file.size > MAX_FILE_SIZE) {
        throw new Error("Files must not exceed 10MB");
      }

      const { data } = await actions.fileupload_createFileAndGetUploadUrl({
        name: fileToUpload.name,
        fileType,
        associatingId,
        // TODO: make this dynamic
        isPublic: true,
        mimeType: fileToUpload.type,
      });

      if (!data) throw new Error("Failed to get upload URL");

      const { signedUrl, file: uploadedFile } = data;

      await axios.put(signedUrl, fileToUpload, {
        headers: { "Content-Type": fileToUpload.type },
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
      toast.error(error instanceof Error ? error.message : "Error uploading file");
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
