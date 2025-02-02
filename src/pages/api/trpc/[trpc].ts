import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";

import { validateSessionToken } from "@/lib/auth/session";
import { appRouter } from "@/server";
import { createTRPCContext } from "@/server/trpc";

export const ALL: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionToken =
      cookies.get("app_auth_token")?.value || request.headers.get("app_auth_token");

    let session = null;
    let user = null;

    if (sessionToken) {
      try {
        const validated = await validateSessionToken(sessionToken);
        session = validated.session;
        user = validated.user;
      } catch (error) {
        console.warn("Session validation failed:", error);
      }
    }

    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async () =>
        createTRPCContext({
          headers: request.headers,
          session,
          user,
        }),
      onError: ({ error }) => {
        console.error("TRPC Error:", error);
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
