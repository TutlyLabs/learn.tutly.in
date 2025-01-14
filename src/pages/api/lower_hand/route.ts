import { APIRoute } from "astro";

import { Controller, LowerHandParams, getSessionFromReq } from "@/lib/controller";

export const POST: APIRoute = async ({ request: req }) => {
  const controller = new Controller();

  try {
    const session = getSessionFromReq(req);
    const reqBody = await req.json();
    const result = await controller.lowerHand(session, reqBody as LowerHandParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in lower_hand:", err);
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
};
