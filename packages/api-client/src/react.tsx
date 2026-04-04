/**
 * React provider + hooks for the AzVirt DMS API.
 *
 * Combines the typed tRPC React-Query client with a React Context so that:
 *  - Any component can call `useApi()` to get fully-typed query/mutation hooks.
 *  - Any component can call `useApiClient()` to get the imperative client for
 *    one-off mutations (e.g. form submissions).
 */
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient as useTanstackQueryClient,
} from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink as plainHttpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "../../../server/routers";

// ─── tRPC React integration ───────────────────────────────────────────────────

const trpc = createTRPCReact<AppRouter>();

// ─── Context ─────────────────────────────────────────────────────────────────

interface ApiContextValue {
  /** Typed React-Query hook set — use for queries and mutations in components. */
  hooks: ReturnType<typeof createTRPCReact<AppRouter>>;
  /** Raw imperative client — use for fire-and-forget calls outside React flow. */
  client: ReturnType<typeof createTRPCClient<AppRouter>>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ApiProviderProps {
  /** Base URL of the AzVirt DMS server. */
  baseUrl: string;
  children: ReactNode;
}

/**
 * Wrap your app root with this provider to gain access to all tRPC hooks.
 *
 * @example
 * ```tsx
 * <ApiProvider baseUrl={import.meta.env.VITE_API_URL}>
 *   <RouterRoot />
 * </ApiProvider>
 * ```
 */
export function ApiProvider({ baseUrl, children }: ApiProviderProps) {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,       // 30 s — avoids unnecessary refetches
        retry: 1,                // retry once on network error
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  const trpcClient = useMemo(
    () => {
      const rawClient = trpc.createClient({
        links: [
          httpBatchLink({
            url: `${baseUrl}/api/trpc`,
            transformer: SuperJSON,
          }),
        ],
      });

      return rawClient;
    },
    [baseUrl],
  );

  // Imperative client — same options as the React one
  const imperativeClient = useMemo(
    () => {
      const rawClient = createTRPCClient<AppRouter>({
        links: [
          plainHttpBatchLink({
            url: `${baseUrl}/api/trpc`,
            transformer: SuperJSON,
          }),
        ],
      });

      // Wrap in proxy to prevent React DevTools crash on 'toJSON' or '$$typeof'
      return new Proxy(rawClient, {
        get(target, prop, receiver) {
          if (prop === 'toJSON' || prop === '$$typeof' || prop === '__esModule') {
            return undefined;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    },
    [baseUrl],
  );

  const contextValue = useMemo<ApiContextValue>(
    () => {
      const val = { hooks: trpc, client: imperativeClient };
      // Prevent React DevTools from crashing when inspecting TRPC proxies
      Object.defineProperty(val, "toJSON", { value: () => "ApiContextValue", enumerable: false });
      return val;
    },
    [imperativeClient],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={contextValue}>
          {children}
        </ApiContext.Provider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Returns the fully-typed tRPC React-Query hook set.
 * Use this for queries and mutations inside React components.
 *
 * @example
 * ```tsx
 * function MaterialsList() {
 *   const { data, isLoading } = useApi().materials.list.useQuery();
 *   if (isLoading) return <Spinner />;
 *   return <ul>{data?.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
 * }
 * ```
 */
export function useApi(): ReturnType<typeof createTRPCReact<AppRouter>> {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used inside <ApiProvider>");
  return ctx.hooks;
}

/**
 * Returns the imperative tRPC client for one-shot mutations outside the
 * normal React-Query flow (e.g., firing a mutation in an event handler
 * without needing the mutation state).
 *
 * @example
 * ```ts
 * const client = useApiClient();
 * await client.auth.logout.mutate();
 * ```
 */
export function useApiClient() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApiClient must be used inside <ApiProvider>");
  return ctx.client;
}

/**
 * Re-exports the underlying TanStack QueryClient so consumers can
 * call `queryClient.invalidateQueries(...)` directly.
 */
export function useQueryClient() {
  return useTanstackQueryClient();
}
