import { AUTH_STATE_COOKIE, providers } from "@lib/auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url, cookies, redirect }) => {
  const providerName = params.provider as keyof typeof providers;

  if (providerName === "credentials") {
    return redirect("/sign-in");
  }

  if (!providerName || !(providerName in providers)) {
    return new Response("Invalid provider", { status: 400 });
  }

  cookies.delete(AUTH_STATE_COOKIE, {
    path: "/",
    secure: import.meta.env.PROD,
    sameSite: "lax",
  });

  const provider = providers[providerName];
  const { state, codeVerifier, redirectUrl } = provider.createAuthorizationURL(url);
  const fromUrl = url.searchParams.get("from");

  const stateData = {
    state,
    codeVerifier,
    from: fromUrl,
    provider: providerName,
    timestamp: Date.now(),
  };

  cookies.set(AUTH_STATE_COOKIE, JSON.stringify(stateData), {
    secure: import.meta.env.PROD,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
    domain: url.hostname === "localhost" ? "localhost" : url.hostname,
  });

  console.log("[OAuth] Setting state cookie:", {
    state,
    provider: providerName,
    redirectUrl: redirectUrl.toString(),
    cookieOptions: {
      secure: import.meta.env.PROD,
      domain: url.hostname === "localhost" ? "localhost" : url.hostname,
    },
  });

  return redirect(redirectUrl.toString());
};
