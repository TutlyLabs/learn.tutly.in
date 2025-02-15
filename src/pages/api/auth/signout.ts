import type { APIRoute } from "astro";

import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get("app_auth_token")?.value;
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

  cookies.delete("app_auth_token", {
    path: "/",
  });

  cookies.delete("google_code_challenge", {
    path: "/",
  });
  cookies.delete("google_oauth_state", {
    path: "/",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/sign-in",
    },
  });
};
