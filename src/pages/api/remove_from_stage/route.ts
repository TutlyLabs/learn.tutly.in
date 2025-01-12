import {
  Controller,
  RemoveFromStageParams,
  getSessionFromReq,
} from "@/lib/controller";
import type {APIRoute} from 'astro';

export const POST: APIRoute = async ({ request: req }) => {
  const controller = new Controller();

  try {
    const session = getSessionFromReq(req);
    const reqBody = await req.json();
    const result = await controller.removeFromStage(session, reqBody as RemoveFromStageParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in remove_from_stage:", err);
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
