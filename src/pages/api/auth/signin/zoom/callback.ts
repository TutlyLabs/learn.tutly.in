import type { APIRoute } from "astro";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import db from "@/lib/db";
import { env } from "@/lib/utils";

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const storedState = cookies.get("zoom_oauth_state")?.value;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!storedState || !code || !state || storedState !== state) {
    return new Response("Please restart the process.", { status: 400 });
  }

  const clientId = env("ZOOM_CLIENT_ID");
  const clientSecret = env("ZOOM_CLIENT_SECRET");
  const redirectUri = `${env("FRONTEND_URL")}/api/auth/signin/zoom/callback`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenResponse = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) {
    return new Response("Failed to exchange code for tokens.", { status: 400 });
  }
  const tokenData = await tokenResponse.json();
  const zoomAccessToken = tokenData.access_token;

  // Fetch user info from Zoom
  const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
    headers: {
      Authorization: `Bearer ${zoomAccessToken}`,
      Accept: "application/json",
    },
  });
  const userInfo = await userResponse.json();
  const zoomId = userInfo.id;
  const email = userInfo.email;

  if (!zoomId || !email) {
    return redirect("/sign-in?error=" + encodeURIComponent("Invalid Zoom user info"));
  }

  // Find user by email
  let userWithAccounts = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { account: true },
  });

  if (!userWithAccounts) {
    return redirect(
      "/sign-in?error=" +
        encodeURIComponent("No account found. Please contact your administrator for access.")
    );
  }

  // Upsert Zoom account
  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "zoom",
        providerAccountId: zoomId,
      },
    },
    create: {
      provider: "zoom",
      providerAccountId: zoomId,
      userId: userWithAccounts.id,
      type: "oauth",
      access_token: tokenData?.access_token,
      refresh_token: tokenData?.refresh_token,
      scope: tokenData?.scope,
      token_type: tokenData?.token_type,
      expires_at:
        typeof tokenData.expires_in === "number"
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      email: email,
      avatar_url: userInfo.pic_url,
    },
    update: {
      access_token: tokenData?.access_token,
      refresh_token: tokenData?.refresh_token,
      scope: tokenData?.scope,
      token_type: tokenData?.token_type,
      expires_at:
        typeof tokenData.expires_in === "number"
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      email: email,
      avatar_url: userInfo.pic_url,
    },
  });

  // Create session
  const session = await db.session.create({
    data: {
      userId: userWithAccounts.id,
      userAgent: "Zoom OAuth",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  cookies.set(AUTH_COOKIE_NAME, session.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    expires: session.expiresAt,
  });

  return redirect("/integrations");
};
