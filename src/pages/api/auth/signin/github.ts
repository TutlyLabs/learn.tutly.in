import { generateState } from "arctic";
import type { APIRoute } from "astro";

import { github } from "@/lib/auth/oauth";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["read:user", "user:email"]);

  cookies.set("github_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  return redirect(url.toString());
};
