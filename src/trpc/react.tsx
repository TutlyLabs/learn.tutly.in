"use client"

import type { QueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"

import SuperJSON from "superjson";

import type { AppRouter } from "@/server"
import { createQueryClient } from "./query-client"

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern
  return (clientQueryClientSingleton ??= createQueryClient())
}

export const api = createTRPCReact<AppRouter>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (op) =>
            import.meta.env.DEV ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: getBaseUrl() + "/api/trpc",
          headers: () => ({
            "x-trpc-source": "nextjs-react",
          }),
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  if (import.meta.env.APPLICATION_URL) return `https://${import.meta.env.APPLICATION_URL}`

  return `http://localhost:${4321}`
}