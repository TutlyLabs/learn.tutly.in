import { defineMiddleware } from "astro:middleware";

import { validateSessionToken } from "@/lib/auth/session";

import { AUTH_COOKIE_NAME } from "./lib/constants";

export const onRequest = defineMiddleware(async ({ cookies, locals, url, request }, next) => {
  const start = Date.now();
  locals.session = null;
  locals.user = null;
  locals.organization = null;
  locals.role = null;

  const sessionId = cookies.get(AUTH_COOKIE_NAME)?.value || request.headers.get(AUTH_COOKIE_NAME);
  const pathname = url.pathname;
  const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

  let requestBody = "";
  if (request.body) {
    try {
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.text();
    } catch (e) {
      requestBody = "Could not parse body";
    }
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_actions/reset_password")
  ) {
    const response = await next();
    logRequest(request.method, pathname, response.status, Date.now() - start, null, requestBody);
    return response;
  }

  if (sessionId) {
    const { session, user } = await validateSessionToken(sessionId);

    if (session && user) {
      locals.session = session;
      locals.user = user;
      locals.organization = user.organization;
      locals.role = user.role;

      if (publicRoutes.includes(pathname)) {
        const response = Response.redirect(new URL("/dashboard", url));
        logRequest(
          request.method,
          pathname,
          response.status,
          Date.now() - start,
          user.id,
          requestBody
        );
        return response;
      }
    } else {
      cookies.delete(AUTH_COOKIE_NAME, {
        path: "/",
      });
      if (!publicRoutes.includes(pathname)) {
        const response = Response.redirect(new URL("/sign-in", url));
        logRequest(
          request.method,
          pathname,
          response.status,
          Date.now() - start,
          null,
          requestBody
        );
        return response;
      }
    }
  } else if (!publicRoutes.includes(pathname)) {
    const response = Response.redirect(new URL("/sign-in", url));
    logRequest(request.method, pathname, response.status, Date.now() - start, null, requestBody);
    return response;
  }

  if (pathname.startsWith("/instructor") && locals.user?.role !== "INSTRUCTOR") {
    const response = new Response("Not Found", { status: 404 });
    logRequest(
      request.method,
      pathname,
      response.status,
      Date.now() - start,
      locals.user?.id ?? null,
      requestBody
    );
    return response;
  }

  if (pathname.startsWith("/tutor") && locals.user?.role === "STUDENT") {
    const response = new Response("Not Found", { status: 404 });
    logRequest(
      request.method,
      pathname,
      response.status,
      Date.now() - start,
      locals.user?.id ?? null,
      requestBody
    );
    return response;
  }

  const response = await next();
  logRequest(
    request.method,
    pathname,
    response.status,
    Date.now() - start,
    locals.user?.id ?? null,
    requestBody
  );
  return response;
});

const logRequest = (
  method: string,
  path: string,
  status: number,
  time: number,
  userId: string | null,
  body: string
) => {
  if (process.env.NODE_ENV === "production") {
    console.log(
      `=>[${method}] ${path} - ${status} - ${time}ms - User: ${userId || "anonymous"} - Body: ${body || "no body"}`
    );

    if (status === 302) {
      console.log("Redirecting to:", path);
    }
  }
};
