import { defineMiddleware } from "astro:middleware";

import { deleteSessionCookie, validateSessionToken } from "@/lib/auth/session";

export const auth = defineMiddleware(async ({ cookies, locals, url, redirect }, next) => {
  locals.session = null;
  locals.user = null;
  locals.organization = null;
  locals.role = null;

  const token = cookies.get("session")?.value;
  const pathname = url.pathname;
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/api/auth/callback/google",
    "/api/auth/signin/google",
    "/api/auth/callback/github",
    "/api/auth/signin/github",
    "/vscode"
  ];

  if (pathname.startsWith("/api/auth")) {
    return next();
  }

  if (token) {
    const { session, user } = await validateSessionToken(token);

    if (session && user) {
      locals.session = session;
      locals.user = user;
      locals.organization = user.organization;
      locals.role = user.role;

      if (publicRoutes.includes(pathname)) {
        return redirect("/dashboard");
      }
    } else {
      deleteSessionCookie({ cookies } as any);
      if (!publicRoutes.includes(pathname)) {
        return redirect("/sign-in");
      }
    }
  } else if (!publicRoutes.includes(pathname)) {
    return redirect("/sign-in");
  }

  if (pathname.startsWith("/instructor") && locals.user?.role !== "INSTRUCTOR") {
    return new Response("Not Found", { status: 404 });
  }

  if (pathname.startsWith("/tutor") && locals.user?.role === "STUDENT") {
    return new Response("Not Found", { status: 404 });
  }

  return next();
});
