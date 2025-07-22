import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { defineAction } from "astro:actions";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { getExtension } from "@/components/useFileUpload";
import db from "@/lib/db";
import { env } from "@/lib/utils";

export const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/svg+xml",
  // Videos
  "video/mp4",
  "video/mpeg",
  "video/x-msvideo",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/webm",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/ogg",
  "audio/midi",
  "audio/x-midi",
  "audio/webm",
  "audio/mp4",
  // Documents
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/msword",
  "application/vnd.oasis.opendocument.text",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
];

const s3Client = new S3Client({
  region: env("AWS_BUCKET_REGION")!,
  credentials: {
    accessKeyId: env("AWS_ACCESS_KEY"),
    secretAccessKey: env("AWS_SECRET_KEY"),
  },
  // only for dev (localstack)
  ...(env("AWS_ENDPOINT") && {
    endpoint: env("AWS_ENDPOINT"),
    forcePathStyle: true,
  }),
});

export const createFileAndGetUploadUrl = defineAction({
  input: z.object({
    name: z.string(),
    fileType: z.enum(["AVATAR", "ATTACHMENT", "NOTES", "OTHER"]),
    associatingId: z.string().optional(),
    isPublic: z.boolean().default(false),
    mimeType: z.string().optional(),
  }),
  async handler({ name, fileType, associatingId, isPublic, mimeType }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    // todo: add mime type validation
    // if (mimeType && !allowedMimeTypes.includes(mimeType)) {
    //   throw new Error("Invalid MIME type");
    // }

    const internalName = `${uuid()}_${Date.now()}${getExtension(name)}`;

    const file = await db.file.create({
      data: {
        name,
        internalName,
        fileType,
        associatingId: associatingId || null,
        isPublic,
        uploadedById: currentUser.id,
      },
    });

    const command = new PutObjectCommand({
      Bucket: env("AWS_BUCKET_NAME"),
      Key: `${file.fileType}/${file.internalName}`,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return { signedUrl, file };
  },
});

export const getDownloadUrl = defineAction({
  input: z.object({
    fileId: z.string(),
  }),
  async handler({ fileId }) {
    const file = await db.file.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new Error("File not found");

    if (file.isPublic) {
      return file.publicUrl;
    }

    const command = new GetObjectCommand({
      Bucket: env("AWS_BUCKET_NAME"),
      Key: `${file.fileType}/${file.internalName}`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  },
});

export const archiveFile = defineAction({
  input: z.object({
    fileId: z.string(),
    reason: z.string(),
  }),
  async handler({ fileId, reason }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const file = await db.file.update({
      where: { id: fileId },
      data: {
        isArchived: true,
        archivedById: currentUser.id,
        archiveReason: reason,
        archivedAt: new Date(),
      },
    });

    return file;
  },
});

export const markFileUploaded = defineAction({
  input: z.object({
    fileId: z.string(),
  }),
  async handler({ fileId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return null;

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new Error("File not found");

    const publicUrl = file.isPublic
      ? `${env("AWS_S3_URL")}/${file.fileType}/${file.internalName}`
      : null;

    const updatedFile = await db.file.update({
      where: { id: fileId },
      data: {
        isUploaded: true,
        uploadedById: currentUser.id,
        publicUrl,
      },
    });

    return updatedFile;
  },
});

export const deleteFile = defineAction({
  input: z.object({
    fileId: z.string(),
  }),
  async handler({ fileId }) {
    const file = await db.file.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new Error("File not found");

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: env("AWS_BUCKET_NAME"),
      Key: `${file.fileType}/${file.internalName}`,
    });
    await s3Client.send(command);

    // Delete from database
    await db.file.delete({
      where: { id: fileId },
    });

    return true;
  },
});

export const updateAssociatingId = defineAction({
  input: z.object({
    fileId: z.string(),
    associatingId: z.string(),
  }),
  async handler({ fileId, associatingId }) {
    const file = await db.file.update({
      where: { id: fileId },
      data: { associatingId },
    });

    return file;
  },
});
