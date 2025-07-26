import { generateState } from "arctic";
import type { APIRoute } from "astro";

import { env } from "@/lib/utils";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const state = generateState();
  const linkParam = url.searchParams.get("link");
  const clientId = env("ZOOM_CLIENT_ID");
  const redirectUri = `${env("FRONTEND_URL")}/api/auth/signin/zoom/callback`;

  const url_ = new URL("https://zoom.us/oauth/authorize");
  url_.searchParams.set("response_type", "code");
  url_.searchParams.set("client_id", clientId);
  url_.searchParams.set("redirect_uri", redirectUri);
  url_.searchParams.set("state", state);

  cookies.set("zoom_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  // Store link parameter if present
  if (linkParam === "true") {
    cookies.set("zoom_oauth_link", "true", {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });
  }

  return redirect(url_.toString());
};
