import type { APIRoute } from "astro";

import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get("app_auth_token")?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
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

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Clear-Site-Data": '"cache", "cookies"',
    },
  });
};
