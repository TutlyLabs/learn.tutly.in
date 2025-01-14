import type { APIRoute } from "astro";

import { Controller, CreateStreamParams } from "@/lib/controller";

// TODO: validate request with Zod

export const POST: APIRoute = async ({ request }) => {
  const controller = new Controller();

  try {
    const reqBody = await request.json();
    const response = await controller.createStream(reqBody as CreateStreamParams);

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
