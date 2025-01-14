import type { APIRoute } from "astro";

import { Controller, JoinStreamParams } from "@/lib/controller";

// TODO: validate request with Zod

export const POST: APIRoute = async ({ request }) => {
  const controller = new Controller();

  try {
    const reqBody = await request.json();
    const response = await controller.joinStream(reqBody as JoinStreamParams);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }

    return new Response(null, { status: 500 });
  }
};
