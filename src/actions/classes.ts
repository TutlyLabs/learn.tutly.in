import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";


import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import ffmpeg from 'ffmpeg-static';


export const createClass = defineAction({
  input: z.object({
    classTitle: z.string().trim().min(1, {
      message: "Title is required",
    }),
    videoLink: z.string().nullable(),
    videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
    courseId: z.string().trim().min(1),
    createdAt: z.string().optional(),
    folderId: z.string().optional(),
    folderName: z.string().optional(),
  }),
  handler: async ({
    classTitle,
    videoLink,
    videoType,
    courseId,
    folderId,
    folderName,
    createdAt,
  }) => {
    try {
      const classData = {
        title: classTitle,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        video: {
          create: {
            videoLink: videoLink ?? null,
            videoType: videoType,
          },
        },
        course: {
          connect: {
            id: courseId,
          },
        },
      };

      if (folderId) {
        return await db.class.create({
          data: {
            ...classData,
            Folder: {
              connect: {
                id: folderId,
              },
            },
          },
        });
      } else if (folderName) {
        return await db.class.create({
          data: {
            ...classData,
            Folder: {
              create: {
                title: folderName,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
              },
            },
          },
        });
      }

      return await db.class.create({
        data: classData,
      });
    } catch (error) {
      console.error("Error creating class:", error);
      throw new Error("Error creating class");
    }
  },
});

// Update the EditClassType interface
export const editClassSchema = z.object({
  classId: z.string(),
  courseId: z.string(),
  classTitle: z.string(),
  videoLink: z.string().nullable(),
  videoType: z.enum(["DRIVE", "YOUTUBE", "ZOOM"]),
  folderId: z.string().optional(),
  folderName: z.string().optional(),
  createdAt: z.string().optional(),
});

export type EditClassType = z.infer<typeof editClassSchema>;

export const updateClass = defineAction({
  input: editClassSchema,
  handler: async (data, { locals }) => {
    const currentUser = locals.user;
    const isCourseAdmin = currentUser?.adminForCourses?.some(
      (course: { id: string }) => course.id === data.courseId
    );
    const haveAccess = currentUser && (currentUser.role === "INSTRUCTOR" || isCourseAdmin);

    if (!haveAccess) {
      throw new Error("You are not authorized to update this class.");
    }

    const { classTitle, videoLink, videoType, folderId, folderName, createdAt } = data;

    let newFolderId: string | undefined = undefined;

    if (folderId && folderName) {
      await db.folder.update({
        where: {
          id: folderId,
        },
        data: {
          title: folderName,
          createdAt: new Date(createdAt ?? ""),
        },
      });
      newFolderId = folderId;
    } else if (folderName) {
      const res = await db.folder.create({
        data: {
          title: folderName,
          createdAt: new Date(createdAt ?? ""),
        },
      });
      newFolderId = res.id;
    } else {
      newFolderId = folderId;
    }

    try {
      const myClass = await db.class.update({
        where: {
          id: data.classId,
        },
        data: {
          title: classTitle,
          createdAt: new Date(createdAt ?? ""),
          video: {
            update: {
              videoLink: videoLink ?? null,
              videoType: videoType,
            },
          },
          ...(newFolderId && {
            Folder: {
              connect: {
                id: newFolderId,
              },
            },
          }),
        },
      });

      return myClass;
    } catch (error) {
      console.error("Error updating class:", error);
      throw new Error("Failed to update class. Please try again later.");
    }
  },
});

export const deleteClass = defineAction({
  input: z.object({
    classId: z.string(),
  }),
  handler: async ({ classId }) => {
    try {
      await db.class.delete({
        where: {
          id: classId,
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting class:", error);
      throw new Error("Failed to delete class. Please try again later.");
    }
  },
});

export const totalNumberOfClasses = defineAction({
  handler: async () => {
    try {
      const res = await db.class.count();
      return res;
    } catch (error) {
      console.error("Error getting total number of classes:", error);
      throw new Error("Failed to get total number of classes. Please try again later.");
    }
  },
});


const s3 = new S3Client({
  region: import.meta.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY!,
    secretAccessKey: import.meta.env.AWS_SECRET_KEY!
  }
});


const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100 MB
const ALLOWED_FILE_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export const uploadAndProcessVideo = defineAction({
  input: z.object({
    fileData: z.object({
      name: z.string(),
      type: z.string(),
      buffer: z.array(z.number())
    })
  }),
  handler: async ({ fileData }) => {
    console.log('Processing video... at src/actions/classes.ts');
    
    if (!ALLOWED_FILE_TYPES.includes(fileData.type)) {
      throw new Error('Invalid file type. Only MP4, MOV, and AVI are allowed.');
    }

    if (fileData.buffer.length > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the maximum limit of 100 MB.');
    }

    const videoId = uuidv4();
    const tempDir = path.join(process.cwd(), 'src/temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const inputPath = path.join(tempDir, `${videoId}-input${path.extname(fileData.name)}`);
    const outputPath = path.join(tempDir, videoId);

    try {
      // Convert array to Buffer
      const buffer = Buffer.from(new Uint8Array(fileData.buffer));
      fs.writeFileSync(inputPath, buffer);
      fs.mkdirSync(outputPath, { recursive: true });

      // Process video with ffmpeg
      try {
        await exec(`ffmpeg -i ${inputPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_list_size 0 -f hls ${outputPath}/index.m3u8`);
      } catch (error) {
        throw new Error(`FFmpeg processing failed: ${(error as Error).message}`);
      }

      // Upload to S3
      const files = fs.readdirSync(outputPath);
      await Promise.all(files.map(async (file) => {
        const fileContent = fs.readFileSync(`${outputPath}/${file}`);
        try {
          await s3.send(new PutObjectCommand({
            Bucket: import.meta.env.AWS_BUCKET_NAME,
            Key: `classes/${videoId}/${file}`,
            Body: fileContent,
            ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T'
          }));
        } catch (error) {
          throw new Error(`S3 upload failed for file ${file}: ${(error as Error).message}`);
        }
      }));

      return { 
        success: true, 
        videoUrl: `https://${import.meta.env.AWS_BUCKET_NAME}.s3.${import.meta.env.AWS_BUCKET_REGION}.amazonaws.com/classes/${videoId}/index.m3u8` 
      };
    } catch (error) {
      console.error('Video processing failed:', error);
      throw new Error('Video processing failed: ' + (error as Error).message);
    } finally {
      // Cleanup
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.rmSync(outputPath, { recursive: true });
    }
  }
});