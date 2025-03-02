import type { APIRoute } from "astro";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/sign-in",
      },
    });
  }

  await db.session.delete({
    where: {
      id: sessionId,
    },
  });

  cookies.delete(AUTH_COOKIE_NAME, {
    path: "/",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/sign-in",
    },
  });
};
