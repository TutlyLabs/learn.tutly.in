import { defineAction } from "astro:actions";
import { z } from "zod";
import { Controller, getSessionFromReq, type CreateIngressParams, type CreateStreamParams, type JoinStreamParams, type InviteToStageParams, type LowerHandParams, type RemoveFromStageParams } from "@/lib/controller";
import { EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";

const controller = new Controller();

export const createIngress = defineAction({
  handler: async (input, { request }) => {
    try {
      const reqBody = await request.json();
      const response = await controller.createIngress(reqBody as CreateIngressParams);
      return response
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Internal Server Error"
      };
    }
  }
});

export const createStream = defineAction({
  handler: async (_, { request }) => {
    try {
      const reqBody = await request.json();
      const { headers, ...params } = reqBody;
      const response = await controller.createStream(params);
      return {
        success: true,
        data: response
      };
    } catch (err) {
      console.error("Create stream error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Internal Server Error"
      };
    }
  }
});

export const joinStream = defineAction({
  handler: async (_, { request }) => {
    try {
      const reqBody = await request.json();
      const response = await controller.joinStream(reqBody as JoinStreamParams);
      return response
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Internal Server Error"
      };
    }
  }
});

export const stopStream = defineAction({
  handler: async (_, { request }) => {
    try {
      const session = getSessionFromReq(request);
      await controller.stopStream(session);
      return {
        success: true
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Internal Server Error"
      };
    }
  }
});

export const raiseHand = defineAction(
  {
    handler: async (_, { request }) => {
      try {
        const session = getSessionFromReq(request);
        const participant = await controller.raiseHand(session);
        return participant
      } catch (err) {
        console.error("Error in raise_hand:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error"
        };
      }
    }
  });

export const lowerHand = defineAction(
  {
    handler: async (_, { request }) => {
      try {
        const session = getSessionFromReq(request);
        const reqBody = await request.json();
        const result = await controller.lowerHand(session, reqBody as LowerHandParams);
        return result
      } catch (err) {
        console.error("Error in lower_hand:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error"
        };
      }
    }
  });

export const inviteToStage = defineAction(
  {
    handler: async (_, { request }) => {
      try {
        const session = getSessionFromReq(request);
        const reqBody = await request.json();
        const result = await controller.inviteToStage(session, reqBody as InviteToStageParams);
        return result
      } catch (err) {
        console.error("Error in invite_to_stage:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error"
        };
      }
    }
  });

export const removeFromStage = defineAction(
  {
    handler: async (_, { request }) => {
      try {
        const session = getSessionFromReq(request);
        const reqBody = await request.json();
        const result = await controller.removeFromStage(session, reqBody as RemoveFromStageParams);
        return result
      } catch (err) {
        console.error("Error in remove_from_stage:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error"
        };
      }
    }
  });

export const startRecording = defineAction({
  input: z.object({
    roomName: z.string(),
  }),
  handler: async (input, { }) => {
    try {
      const roomName = input.roomName;

      if (!roomName) {
        return {
          success: false,
          error: "Missing roomName parameter"
        };
      }

      const requiredEnvVars = {
        LIVEKIT_API_KEY: import.meta.env.LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET: import.meta.env.LIVEKIT_API_SECRET,
        LIVEKIT_WS_URL: import.meta.env.VITE_LIVEKIT_WS_URL,
        S3_KEY_ID: import.meta.env.AWS_ACCESS_KEY,
        S3_KEY_SECRET: import.meta.env.AWS_SECRET_KEY,
        S3_BUCKET: import.meta.env.AWS_BUCKET_NAME,
        S3_ENDPOINT: import.meta.env.S3_ENDPOINT,
        S3_REGION: import.meta.env.AWS_BUCKET_REGION,
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        return {
          success: false,
          error: `Missing required environment variables: ${missingVars.join(", ")}`
        };
      }

      const hostURL = new URL(requiredEnvVars.LIVEKIT_WS_URL!);
      hostURL.protocol = "https:";

      const egressClient = new EgressClient(
        hostURL.origin,
        requiredEnvVars.LIVEKIT_API_KEY,
        requiredEnvVars.LIVEKIT_API_SECRET
      );

      const existingEgresses = await egressClient.listEgress({ roomName: roomName.toString() });

      if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
        return {
          success: false,
          error: "Meeting is already being recorded"
        };
      }

      const filepath = `${new Date(Date.now()).toISOString()}-${roomName}.mp4`;

      const fileOutput = new EncodedFileOutput({
        filepath,
        output: {
          case: "s3",
          value: new S3Upload({
            endpoint: requiredEnvVars.S3_ENDPOINT!,
            accessKey: requiredEnvVars.S3_KEY_ID!,
            secret: requiredEnvVars.S3_KEY_SECRET!,
            region: requiredEnvVars.S3_REGION!,
            bucket: requiredEnvVars.S3_BUCKET!,
          }),
        },
      });

      await egressClient.startRoomCompositeEgress(
        roomName.toString(),
        {
          file: fileOutput,
        },
        {
          layout: "speaker",
        }
      );

      return { success: true };
    } catch (error) {
      console.error("Recording start error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error"
      };
    }
  }
});

export const stopRecording = defineAction({
  input: z.object({
    roomName: z.string(),
  }),
  handler: async (input, { }) => {
    try {
      const roomName = input.roomName;

      if (!roomName) {
        return {
          success: false,
          error: "Missing roomName parameter"
        };
      }

      const requiredEnvVars = {
        LIVEKIT_API_KEY: import.meta.env.LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET: import.meta.env.LIVEKIT_API_SECRET,
        LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_WS_URL,
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        return {
          success: false,
          error: `Missing required environment variables: ${missingVars.join(", ")}`
        };
      }

      const hostURL = new URL(requiredEnvVars.LIVEKIT_URL!);
      hostURL.protocol = "https:";

      const egressClient = new EgressClient(
        hostURL.origin,
        requiredEnvVars.LIVEKIT_API_KEY,
        requiredEnvVars.LIVEKIT_API_SECRET
      );

      const activeEgresses = (await egressClient.listEgress({ roomName: roomName.toString() }))
        .filter((info) => info.status < 2);

      if (activeEgresses.length === 0) {
        return {
          success: false,
          error: "No active recording found"
        };
      }

      await Promise.all(
        activeEgresses.map((info) => egressClient.stopEgress(info.egressId))
      );

      return { success: true };
    } catch (error) {
      console.error("Recording stop error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error"
      };
    }
  }
});

