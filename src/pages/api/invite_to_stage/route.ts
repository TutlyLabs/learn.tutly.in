import { Controller, InviteToStageParams, getSessionFromReq } from "@/lib/controller";

// TODO: validate request with Zod

export async function POST(req: Request) {
  const controller = new Controller();

  try {
    const session = getSessionFromReq(req);
    const reqBody = await req.json();
    const result = await controller.inviteToStage(session, reqBody as InviteToStageParams);

    return Response.json({
      success: true,
      participant: result,
    });
  } catch (err) {
    console.error("Error in invite_to_stage:", err);
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
