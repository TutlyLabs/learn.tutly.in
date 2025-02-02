/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import type { Session } from "@prisma/client";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { SessionUser, validateSessionToken } from "@/lib/auth/session";
import db from "@/lib/db";

/**
 * Isomorphic Session getter for API requests
 * - Expo requests will have a session token in the Authorization header
 * - Next.js requests will have a session token in cookies
 */
const isomorphicGetSession = async (headers: Headers) => {
  const authToken = headers.get("app_auth_token") ?? null;
  if (!authToken) {
    return { session: null, user: null };
  }

  try {
    const { session, user } = await validateSessionToken(authToken);
    return { session, user };
  } catch (error) {
    return { session: null, user: null };
  }
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  session: Session | null;
  user: SessionUser | null;
}) => {
  const authToken = opts.headers.get("app_auth_token") ?? null;
  // Use the passed session/user if available, otherwise try to get from token
  const { session, user } =
    opts.session && opts.user
      ? { session: opts.session, user: opts.user }
      : await isomorphicGetSession(opts.headers);

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source, "by", user?.email ?? "anonymous");

  return {
    session,
    user,
    db,
    token: authToken,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    } as ProtectedTRPCContext,
  });
});

export const instructorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== "INSTRUCTOR") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const mentorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== "MENTOR") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

export type ProtectedTRPCContext = TRPCContext & {
  user: NonNullable<TRPCContext["user"]>;
  session: NonNullable<TRPCContext["session"]>;
};
