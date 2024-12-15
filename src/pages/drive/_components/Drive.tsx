import { File } from "@prisma/client";
import { actions } from "astro:actions";
import { formatDistanceToNow } from "date-fns";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileUpload } from "@/components/useFileUpload";

const Drive = ({ uploadedFiles }: { uploadedFiles: File[] }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const { uploadFile } = useFileUpload({
    fileType: "OTHER",
    onUpload: async (file: File) => {
      if (!file || !file.publicUrl) return;
      toast.success("File uploaded successfully");
      window.location.reload();
    },
  });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      if (!file) return;
      const user = await actions.users_getCurrentUser();
      if (!user) return;
      await uploadFile(file, user.data?.id);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const { data: downloadUrl } = await actions.fileupload_getDownloadUrl({
        fileId,
      });
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleArchive = async (fileId: string) => {
    try {
      await actions.fileupload_archiveFile({
        fileId,
        reason: deleteReason,
      });
      toast.success("File deleted successfully");
      setDeleteReason("");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const fileTypes = ["ALL", "OTHER", "NOTES", "ATTACHMENT", "AVATAR"] as const;

  const DeleteDialog = ({ fileId }: { fileId: string }) => (
    <Button
      variant="ghost"
      size="icon"
      title="Delete"
      onClick={async () => {
        const reason = window.prompt("Please enter a reason for deletion:");
        if (reason !== null) {
          setDeleteReason(reason);
          await handleArchive(fileId);
        }
      }}
    >
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );

  const FileCard = ({ file }: { file: File }) => (
    <Card key={file.id} className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="font-medium text-lg truncate max-w-[200px]">{file.name}</h3>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownload(file.id)}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <DeleteDialog fileId={file.id} />
        </div>
      </div>
    </Card>
  );

  const EmptyState = ({ fileType }: { fileType?: string }) => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-medium text-gray-600">
        No {fileType ? `${fileType.toLowerCase()} ` : ""}files uploaded yet
      </h3>
      <p className="text-gray-500">
        Your uploaded {fileType ? `${fileType.toLowerCase()} ` : ""}files will appear here
      </p>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Drive</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload File
          </Button>
          <Input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {isUploading && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded">
            <div className="h-full bg-blue-500 rounded animate-pulse" />
          </div>
        </div>
      )}

      <Tabs defaultValue="ALL" className="w-full">
        <TabsList className="mb-4">
          {fileTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {fileTypes.map((fileType) => {
          const filteredFiles =
            fileType === "ALL"
              ? uploadedFiles
              : uploadedFiles.filter((file) => file.fileType === fileType);

          return (
            <TabsContent key={fileType} value={fileType}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>

              {filteredFiles.length === 0 && (
                <EmptyState fileType={fileType !== "ALL" ? fileType : ""} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Drive;
