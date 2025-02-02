import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

export type { AppRouter } from "./root";
export { createTRPCContext } from "./trpc";

export const createCaller = createCallerFactory(appRouter);
export { appRouter };

export type RouterOutputs = inferRouterOutputs<typeof appRouter>;
export type RouterInputs = inferRouterInputs<typeof appRouter>;
