import { generateState } from "arctic";
import type { APIRoute } from "astro";

import { github } from "@/lib/auth/oauth";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const state = generateState();
  const linkParam = url.searchParams.get("link");
  const url_ = github.createAuthorizationURL(state, ["read:user", "user:email"]);

  cookies.set("github_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  if (linkParam === "true") {
    cookies.set("github_oauth_link", "true", {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });
  }

  return redirect(url_.toString());
};
