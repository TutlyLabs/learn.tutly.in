import { EgressClient } from "livekit-server-sdk";
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
      LIVEKIT_URL: process.env.LIVEKIT_URL,
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

    const hostURL = new URL(requiredEnvVars.LIVEKIT_URL!);
    hostURL.protocol = "https:";

    const egressClient = new EgressClient(
      hostURL.origin,
      requiredEnvVars.LIVEKIT_API_KEY,
      requiredEnvVars.LIVEKIT_API_SECRET
    );

    const activeEgresses = (await egressClient.listEgress({ roomName })).filter(
      (info) => info.status < 2
    );

    if (activeEgresses.length === 0) {
      return new NextResponse("No active recording found", { status: 404 });
    }

    await Promise.all(activeEgresses.map((info) => egressClient.stopEgress(info.egressId)));

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Recording stop error:", error);
    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", {
      status: 500,
    });
  }
}
