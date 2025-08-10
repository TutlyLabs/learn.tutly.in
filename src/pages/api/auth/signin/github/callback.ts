import type { APIRoute } from "astro";

import { github } from "@/lib/auth/oauth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const storedState = cookies.get("github_oauth_state")?.value;
  const isLinking = cookies.get("github_oauth_link")?.value === "true";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!storedState || !code || !state || storedState !== state) {
    return new Response("Please restart the process.", { status: 400 });
  }

  let tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch {
    return new Response("Please restart the process.", { status: 400 });
  }

  // Fetch user info from GitHub using the access token
  const tokenData: Record<string, any> = tokens.data ?? {};
  const githubAccessToken = tokenData.access_token;
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  const userInfo = await userResponse.json();
  const githubId = userInfo.id?.toString();

  let email = userInfo.email;
  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    const emails = await emailResponse.json();
    if (Array.isArray(emails)) {
      const primary = emails.find((e: any) => e.primary && e.verified);
      email = primary?.email || emails[0]?.email;
    }
  }

  if (!githubId || !email) {
    return redirect("/sign-in?error=" + encodeURIComponent("Invalid GitHub user info"));
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

  // Upsert GitHub account
  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "github",
        providerAccountId: githubId,
      },
    },
    create: {
      provider: "github",
      providerAccountId: githubId,
      userId: userWithAccounts.id,
      type: "oauth",
      token_type: tokenData?.token_type,
      access_token: tokenData?.access_token,
      scope: tokenData?.scope,
      username: userInfo?.login,
      email: email,
      avatar_url: userInfo?.avatar_url,
    },
    update: {
      access_token: tokenData?.access_token,
      token_type: tokenData?.token_type,
      scope: tokenData?.scope,
      username: userInfo?.login,
      email: email,
      avatar_url: userInfo?.avatar_url,
    },
  });

  // Clean up link cookie
  cookies.delete("github_oauth_link", { path: "/" });

  if (!isLinking) {
    // Create session
    const session = await db.session.create({
      data: {
        userId: userWithAccounts.id,
        userAgent: "GitHub OAuth",
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
