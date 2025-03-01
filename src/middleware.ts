import { defineMiddleware } from "astro:middleware";
import { getUserFromSession, updateUserSessionExpiration } from "@/lib/auth/core/session";
import { adaptAstroCookiesToCookies } from "@/lib/auth/astro/cookies";
import type { Organization, Role } from "@prisma/client";

const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];

const authRoutes = [
  "/api/auth/callback/google",
  "/api/auth/signin/google",
  "/api/auth/callback/github",
  "/api/auth/signin/github",
  "/api/oauth",
  "/reset-password",
  "/_actions/reset_password",
  "/_actions/auth"
];

export const onRequest = defineMiddleware(
  async ({ cookies, locals, url, redirect, request }, next) => {
    // Initialize locals
    locals.session = null;
    locals.user = null;
    locals.organization = null;
    locals.role = null;

    const pathname = url.pathname;

    // Skip auth check for auth-related routes
    if (pathname.startsWith("/api/auth") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/_actions/reset_password") ||
      pathname.startsWith("/_actions/auth") ||
      pathname.startsWith("/api/oauth")) {
      return next();
    }

    // Get session from cookie or header
    const sessionId = cookies.get("app_auth_token")?.value || request.headers.get("app_auth_token");

    if (sessionId) {
      // Validate and get user from session
      const adaptedCookies = adaptAstroCookiesToCookies(cookies);
      const user = await getUserFromSession(adaptedCookies);

      if (user) {
        // Set user data in locals
        locals.user = user;
        locals.organization = user.organization;
        locals.role = user.role;

        // Update session expiration
        await updateUserSessionExpiration(adaptedCookies);

        // Redirect authenticated users away from public routes
        if (["/sign-in", "/sign-up", "/forgot-password"].includes(pathname)) {
          return redirect("/dashboard");
        }

        // Role-based access control
        if (pathname.startsWith("/instructor") && user.role !== "INSTRUCTOR") {
          return new Response("Not Found", { status: 404 });
        }

        if (pathname.startsWith("/tutor") && user.role === "STUDENT") {
          return new Response("Not Found", { status: 404 });
        }

      } else {
        // Invalid session, clear it
        cookies.delete("app_auth_token", { path: "/" });

        // Redirect to sign in if not on public route
        if (!["/sign-in", "/sign-up", "/forgot-password"].includes(pathname)) {
          return redirect("/sign-in");
        }
      }
    } else if (!["/sign-in", "/sign-up", "/forgot-password"].includes(pathname)) {
      // No session, redirect to sign in if not on public route
      return redirect("/sign-in");
    }

    // Handle prefetch requests
    const isPrefetch = request.headers.get("Purpose") === "prefetch" ||
      request.headers.get("Sec-Purpose") === "prefetch";
    if (pathname === "/dashboard" && isPrefetch) {
      return next();
    }

    return next();
  }
);
