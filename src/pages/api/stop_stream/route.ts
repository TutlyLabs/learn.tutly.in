import { Controller, getSessionFromReq } from "@/lib/controller";
import type {APIRoute} from 'astro';

// TODO: validate request with Zod

export const POST: APIRoute = async ({ request: req }) =>
{
  const controller = new Controller();

  try {
    const session = getSessionFromReq(req);
    await controller.stopStream(session);

    return new Response(null, { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }

    return new Response(null, { status: 500 });
  }
}
