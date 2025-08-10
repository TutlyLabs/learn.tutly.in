import { decodeIdToken } from "arctic";
import type { APIRoute } from "astro";

import { google } from "@/lib/auth/oauth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const storedState = cookies.get("google_oauth_state")?.value;
  const codeVerifier = cookies.get("google_code_verifier")?.value;
  const isLinking = cookies.get("google_oauth_link")?.value === "true";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!storedState || !codeVerifier || !code || !state || storedState !== state) {
    return new Response("Please restart the process.", { status: 400 });
  }

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    return new Response("Please restart the process.", { status: 400 });
  }

  const claims = decodeIdToken(tokens.idToken());
  // Extract sub (googleId), email, and picture from claims
  const googleId = (claims as { sub?: string })?.sub;
  const email = (claims as { email?: string })?.email;
  const picture = (claims as { picture?: string })?.picture ?? null;
  if (!googleId) {
    return redirect("/sign-in?error=" + encodeURIComponent("Invalid Google ID token"));
  }

  if (!email) {
    return redirect("/sign-in?error=" + encodeURIComponent("No email found in Google account"));
  }

  // 1. Query user table for user with this email, including their accounts
  let userWithAccounts: {
    id: string;
    account: { provider: string; providerAccountId: string }[];
  } | null = null;
  if (email) {
    userWithAccounts = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { account: true },
    });
  }

  if (!userWithAccounts) {
    // No user found, redirect with error
    return redirect(
      "/sign-in?error=" +
        encodeURIComponent("No account found. Please contact your administrator for access.")
    );
  }

  // 2. Upsert the Google account with latest OAuth details
  const tokenData: Record<string, any> = tokens.data ?? {};
  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: googleId,
      },
    },
    create: {
      provider: "google",
      providerAccountId: googleId,
      userId: userWithAccounts.id,
      type: "oauth",
      token_type: tokenData.token_type,
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      scope: tokenData.scope,
      expires_at:
        typeof tokenData.expires_in === "number"
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      email: email,
      avatar_url: picture,
    },
    update: {
      token_type: tokenData.token_type,
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      scope: tokenData.scope,
      expires_at:
        typeof tokenData.expires_in === "number"
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      email: email,
      avatar_url: picture,
    },
  });

  // Clean up link cookie
  cookies.delete("google_oauth_link", { path: "/" });

  // Only create session if not linking
  if (!isLinking) {
    // 3. Create session
    const session = await db.session.create({
      data: {
        userId: userWithAccounts.id,
        userAgent: "Google OAuth",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      },
    });

    cookies.set(AUTH_COOKIE_NAME, session.id, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      expires: session.expiresAt,
    });
  }

  return redirect("/integrations");
};
