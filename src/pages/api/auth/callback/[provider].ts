import { AUTH_SESSION_COOKIE, createSession, providers } from "@lib/auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url, cookies, request, redirect }) => {
  const providerName = params.provider as keyof typeof providers;
  if (!providerName || !(providerName in providers)) {
    return new Response("Invalid provider", { status: 400 });
  }

  const provider = providers[providerName];
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("[OAuth Callback] Received request:", {
    provider: providerName,
    code: !!code,
    state,
    url: url.toString(),
  });

  if (!code || !state) {
    console.error("[OAuth Callback] Missing code or state");
    return redirect("/sign-in?error=" + encodeURIComponent("Missing required parameters"));
  }

  try {
    const codeVerifier = provider.getLastCodeVerifier?.();
    if (!codeVerifier) {
      throw new Error("No code verifier found");
    }

    const tokens = await provider.validateAuthorizationCode(code, codeVerifier, url);

    const oauthUser = await provider.fetchUser(tokens);
    if (!oauthUser) {
      throw new Error("Failed to fetch user info");
    }

    let providerAccountId: string;
    if (providerName === "google") {
      const googleUser = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      }).then((res) => res.json());
      providerAccountId = googleUser.id;
      // } else if (providerName === "github") {
      //   const githubUser = await fetch("https://api.github.com/user", {
      //     headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      //   }).then((res) => res.json());
      //   providerAccountId = githubUser.id.toString();
    } else {
      providerAccountId = oauthUser.email;
    }

    const sessionId = await createSession(
      providerName,
      tokens,
      providerAccountId,
      oauthUser,
      request.headers.get("user-agent") || undefined
    );

    if (!sessionId) {
      throw new Error("Failed to create session");
    }

    cookies.set(AUTH_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      domain: url.hostname === "localhost" ? "localhost" : url.hostname,
    });

    console.log("[OAuth Callback] Setting session cookie:", {
      sessionId,
      cookieName: AUTH_SESSION_COOKIE,
      cookieOptions: {
        secure: import.meta.env.PROD,
        domain: url.hostname === "localhost" ? "localhost" : url.hostname,
      },
    });

    return redirect("/dashboard");
  } catch (error) {
    console.error("[OAuth Callback] Error:", error);
    return redirect(
      "/sign-in?error=" +
        encodeURIComponent(error instanceof Error ? error.message : "Authentication failed")
    );
  }
};
