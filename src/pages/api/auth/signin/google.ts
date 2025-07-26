import { generateCodeVerifier, generateState } from "arctic";
import type { APIRoute } from "astro";

import { google } from "@/lib/auth/oauth";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const linkParam = url.searchParams.get("link");
  const url_ = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  cookies.set("google_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });
  cookies.set("google_code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  // Store link parameter if present
  if (linkParam === "true") {
    cookies.set("google_oauth_link", "true", {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });
  }

  return redirect(url_.toString());
};
