import { Controller, getSessionFromReq } from "@/lib/controller";

// TODO: validate request with Zod

export async function POST(req: Request) {
  const controller = new Controller();

  try {
    const session = getSessionFromReq(req);
    const participant = await controller.raiseHand(session);

    return Response.json({
      success: true,
      participant
    });
  } catch (err) {
    console.error("Error in raise_hand:", err);
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
