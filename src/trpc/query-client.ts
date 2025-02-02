import { QueryClient } from "@tanstack/react-query"
import type { DefaultOptions } from "@tanstack/react-query"

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        cacheTime: 5 * 60 * 1000,
      },
    } as DefaultOptions,
  })
