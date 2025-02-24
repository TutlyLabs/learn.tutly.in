import { defineMiddleware } from "astro:middleware";

import { validateSessionToken } from "@/lib/auth/session";

export const auth = defineMiddleware(async ({ cookies, locals, url, redirect, request }, next) => {
  locals.session = null;
  locals.user = null;
  locals.organization = null;
  locals.role = null;

  // fallback to header
  const sessionId = cookies.get("app_auth_token")?.value || request.headers.get("app_auth_token");
  const pathname = url.pathname;
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/api/auth/callback/google",
    "/api/auth/signin/google",
    "/api/auth/callback/github",
    "/api/auth/signin/github",
  ];

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_actions/reset_password")
  ) {
    return next();
  }

  if (sessionId) {
    const { session, user } = await validateSessionToken(sessionId);

    if (session && user) {
      locals.session = session;
      locals.user = user;
      locals.organization = user.organization;
      locals.role = user.role;

      if (publicRoutes.includes(pathname)) {
        return redirect("/dashboard");
      }
    } else {
      cookies.delete("app_auth_token", {
        path: "/",
      });
      if (!publicRoutes.includes(pathname)) {
        return redirect("/sign-in");
      }
    }
  } else if (!publicRoutes.includes(pathname)) {
    return redirect("/sign-in");
  }

  // public route when pre-fetching
  const isPrefetch =
    request.headers.get("Purpose") === "prefetch" ||
    request.headers.get("Sec-Purpose") === "prefetch";

  if (pathname === "/dashboard" && isPrefetch) {
    return next();
  }

  if (pathname.startsWith("/instructor") && locals.user?.role !== "INSTRUCTOR") {
    return new Response("Not Found", { status: 404 });
  }

  if (pathname.startsWith("/tutor") && locals.user?.role === "STUDENT") {
    return new Response("Not Found", { status: 404 });
  }

  return next();
});
