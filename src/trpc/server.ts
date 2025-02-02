import type { AppRouter } from "@/server"
import { createCaller, createTRPCContext } from "@/server/index"
import { validateSessionToken } from "@/lib/auth/session"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import SuperJSON from "superjson"

// Create a regular TRPC client for server-side usage
export const api = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
})

// Export a helper to create server-side caller with context
export const createServerCaller = async (request: Request) => {
  const heads = new Headers(request.headers)
  heads.set("x-trpc-source", "astro")

  const cookie = request.headers.get("cookie") || ""
  const sessionId = cookie.split("; ").find(row => row.startsWith("app_auth_token="))?.split("=")[1] || ""
  
  const { session, user } = await validateSessionToken(sessionId)

  const ctx = await createTRPCContext({
    headers: heads,
    session,
    user,
  })

  return createCaller(ctx)
}
