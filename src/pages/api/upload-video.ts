import type { APIRoute } from "astro";
import { S3Client, PutObjectCommand ,GetObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const s3Client = new S3Client({
  region: import.meta.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY,
    secretAccessKey: import.meta.env.AWS_SECRET_KEY,
  },
});

export const POST: APIRoute = async ({ request }) => {
    console.log("At the route of api/upload-video.ts");
    
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-'));
    const inputPath = path.join(tempDir, file.name);
    await fs.writeFile(inputPath, buffer);

    const videoId = uuidv4();
    const outputDir = path.join(tempDir, videoId);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'index.m3u8');

    // Process video with ffmpeg
    const ffmpegCommand = `ffmpeg -i ${inputPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputDir}/segment%03d.ts" -start_number 0 ${outputPath}`;
    await execAsync(ffmpegCommand);

    // Upload processed files to S3
    const bucketName = import.meta.env.AWS_BUCKET_NAME;
    const s3Key = `classes/${videoId}/index.m3u8`;

    const uploadPromises = [
      uploadFileToS3(outputPath, bucketName, s3Key),
      ...(await fs.readdir(outputDir))
        .filter(file => file.endsWith('.ts'))
        .map(file => uploadFileToS3(
          path.join(outputDir, file),
          bucketName,
          `classes/${videoId}/${file}`
        ))
    ];

    await Promise.all(uploadPromises);

    // Generate a signed URL for the main m3u8 file
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log(`Video processed and uploaded to ${signedUrl}`);
    
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });

    return new Response(JSON.stringify({ videoUrl: signedUrl }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Video processing failed" }), { status: 500 });
  }
};

async function uploadFileToS3(filePath: string, bucket: string, key: string) {
  const fileContent = await fs.readFile(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
  });
  await s3Client.send(command);
}

