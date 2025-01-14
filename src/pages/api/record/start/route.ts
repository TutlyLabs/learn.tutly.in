import { EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const roomName = req.nextUrl.searchParams.get("roomName");

    if (!roomName) {
      return new NextResponse("Missing roomName parameter", { status: 400 });
    }

    const requiredEnvVars = {
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
      LIVEKIT_WS_URL: process.env.VITE_LIVEKIT_WS_URL,
      S3_KEY_ID: process.env.S3_KEY_ID,
      S3_KEY_SECRET: process.env.S3_KEY_SECRET,
      S3_BUCKET: process.env.S3_BUCKET,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_REGION: process.env.S3_REGION,
    };

    // Check for missing environment variables
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return new NextResponse(`Missing required environment variables: ${missingVars.join(", ")}`, {
        status: 500,
      });
    }

    const hostURL = new URL(requiredEnvVars.VITE_LIVEKIT_WS_URL!);
    hostURL.protocol = "https:";

    const egressClient = new EgressClient(
      hostURL.origin,
      requiredEnvVars.LIVEKIT_API_KEY,
      requiredEnvVars.LIVEKIT_API_SECRET
    );

    const existingEgresses = await egressClient.listEgress({ roomName });

    if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
      return new NextResponse("Meeting is already being recorded", { status: 409 });
    }

    const filepath = `${new Date(Date.now()).toISOString()}-${roomName}.mp4`;

    const fileOutput = new EncodedFileOutput({
      filepath,
      output: {
        case: "s3",
        value: new S3Upload({
          endpoint: requiredEnvVars.S3_ENDPOINT,
          accessKey: requiredEnvVars.S3_KEY_ID,
          secret: requiredEnvVars.S3_KEY_SECRET,
          region: requiredEnvVars.S3_REGION,
          bucket: requiredEnvVars.S3_BUCKET,
        }),
      },
    });

    await egressClient.startRoomCompositeEgress(
      roomName,
      {
        file: fileOutput,
      },
      {
        layout: "speaker",
      }
    );

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Recording start error:", error);
    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", {
      status: 500,
    });
  }
}
