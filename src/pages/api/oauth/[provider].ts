import type { APIRoute } from "astro";
import { z } from "zod";

import { getOAuthClient } from "@/lib/auth/core/oauth/base";
import type { OAuthProvider } from "@/lib/auth/core/oauth/base";
import { createUserSession } from "@/lib/auth/core/session";
import { adaptAstroCookiesToCookies } from "@/lib/auth/astro/cookies";
import db from "@/lib/db";

const oAuthProviders = ["github", "google"] as const;

export const GET: APIRoute = async ({ params, cookies, redirect, request }) => {
  console.log("[OAuth Callback] Starting OAuth callback");
  const { provider: rawProvider } = params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("[OAuth Callback] Provider:", rawProvider);
  console.log("[OAuth Callback] Code present:", !!code);
  console.log("[OAuth Callback] State present:", !!state);

  try {
    const provider = z.enum(oAuthProviders).parse(rawProvider);
    console.log("[OAuth Callback] Validated provider:", provider);

    if (typeof code !== "string" || typeof state !== "string") {
      console.error("[OAuth Callback] Missing code or state");
      cookies.delete("oAuthState", { path: "/" });
      cookies.delete("oAuthCodeVerifier", { path: "/" });
      return redirect(`/sign-in?oauthError=${encodeURIComponent("Failed to connect. Please try again.")}`);
    }

    const oAuthClient = getOAuthClient(provider);
    console.log("[OAuth Callback] Created OAuth client");

    const adaptedCookies = adaptAstroCookiesToCookies(cookies);
    console.log("[OAuth Callback] Adapted cookies for OAuth flow");

    const oAuthUser = await oAuthClient.fetchUser(code, state, adaptedCookies);
    console.log("[OAuth Callback] Successfully fetched user data");

    const user = await connectUserToAccount(oAuthUser, provider);
    console.log("[OAuth Callback] Connected user to account");

    await createUserSession(user, adaptedCookies);
    console.log("[OAuth Callback] Created user session");

    // Clean up OAuth cookies after successful authentication
    cookies.delete("oAuthState", { path: "/" });
    cookies.delete("oAuthCodeVerifier", { path: "/" });

    return redirect("/dashboard");
  } catch (error) {
    console.error("[OAuth Callback] Error in OAuth callback:", error);
    // Clean up OAuth cookies on error
    cookies.delete("oAuthState", { path: "/" });
    cookies.delete("oAuthCodeVerifier", { path: "/" });
    return redirect(`/sign-in?error=${encodeURIComponent("Failed to connect. Please try again.")}`);
  }
};

async function connectUserToAccount(
  { id, email, name }: { id: string; email: string; name: string },
  provider: OAuthProvider
) {
  return db.$transaction(async (tx) => {
    let user = await tx.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          name,
          username: email.split("@")[0]!,
          role: "STUDENT",
          emailVerified: new Date(),
          isProfilePublic: false,
        },
      });
    }

    await tx.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: id
        }
      },
      create: {
        type: "oauth",
        provider,
        providerAccountId: id,
        userId: user.id
      },
      update: {
        userId: user.id
      }
    });

    return user;
  });
}

