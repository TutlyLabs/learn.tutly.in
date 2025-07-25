import { generateState } from "arctic";
import type { APIRoute } from "astro";

import { env } from "@/lib/utils";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const state = generateState();
  const clientId = env("ZOOM_CLIENT_ID");
  const redirectUri = `${env("FRONTEND_URL")}/api/auth/signin/zoom/callback`;

  const url = new URL("https://zoom.us/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  cookies.set("zoom_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  return redirect(url.toString());
};
