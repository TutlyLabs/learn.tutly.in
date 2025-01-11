import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { files } from "~/server/db/schema";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const fileUploadRouter = createTRPCRouter({
  createAndGetUploadUrl: protectedProcedure
    .input(z.object({
      name: z.string(),
      fileType: z.enum(["AVATAR", "ATTACHMENT", "NOTES", "OTHER"]),
      associatingId: z.string().optional(),
      isPublic: z.boolean().default(false),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const internalName = `${crypto.randomUUID()}_${Date.now()}${getExtension(input.name)}`;

      const [file] = await ctx.db.insert(files).values({
        name: input.name,
        internalName,
        fileType: input.fileType,
        associatingId: input.associatingId,
        isPublic: input.isPublic,
        uploadedById: ctx.session.user.id,
      }).returning();

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${file.fileType}/${file.internalName}`,
        ContentType: input.mimeType,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return { signedUrl, file };
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(eq(files.id, input.fileId));

      if (!file) throw new Error("File not found");

      if (file.isPublic) {
        return file.publicUrl;
      }

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${file.fileType}/${file.internalName}`,
      });

      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }),

  archive: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(files)
        .set({
          isArchived: true,
          archivedById: ctx.session.user.id,
          archiveReason: input.reason,
          archivedAt: new Date(),
        })
        .where(eq(files.id, input.fileId))
        .returning();

      return updated;
    }),

  markUploaded: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(eq(files.id, input.fileId));

      if (!file) throw new Error("File not found");

      const publicUrl = file.isPublic
        ? `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${file.fileType}/${file.internalName}`
        : null;

      const [updated] = await ctx.db
        .update(files)
        .set({
          isUploaded: true,
          uploadedById: ctx.session.user.id,
          publicUrl,
        })
        .where(eq(files.id, input.fileId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(eq(files.id, input.fileId));

      if (!file) throw new Error("File not found");

      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${file.fileType}/${file.internalName}`,
      });
      await s3Client.send(command);

      await ctx.db.delete(files).where(eq(files.id, input.fileId));

      return true;
    }),

  updateAssociatingId: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      associatingId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(files)
        .set({ associatingId: input.associatingId })
        .where(eq(files.id, input.fileId))
        .returning();

      return updated;
    }),
});

function getExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext}` : '';
} 