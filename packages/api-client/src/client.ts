/**
 * Core tRPC client factory.
 * No React dependency — works in any JS runtime.
 */
import {
  createTRPCClient,
  httpBatchLink,
  type CreateTRPCClient,
} from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "../../../server/routers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiClientOptions {
  /**
   * Base URL of the AzVirt DMS server.
   * e.g. "http://localhost:3000" or "https://your-app.netlify.app"
   */
  baseUrl: string;

  /**
   * Optional: function returning additional headers for every request.
   * Useful for injecting Authorization headers in non-browser contexts.
   */
  headers?: () => Record<string, string>;

  /**
   * Optional: custom fetch implementation.
   * Defaults to the global fetch (browser / Node 18+).
   */
  fetch?: typeof globalThis.fetch;
}

// The full, typed router client.
export type ApiClient = CreateTRPCClient<AppRouter>;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a fully-typed AzVirt DMS API client.
 *
 * @example
 * ```ts
 * const api = createApiClient({ baseUrl: "http://localhost:3000" });
 *
 * // Query current user
 * const user = await api.auth.me.query();
 *
 * // Mutate
 * await api.auth.login.mutate({ username: "admin", password: "secret" });
 *
 * // List materials
 * const materials = await api.materials.list.query();
 * ```
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const rawClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${options.baseUrl}/api/trpc`,
        transformer: SuperJSON,
        headers: options.headers,
        fetch: options.fetch ?? globalThis.fetch,
      }),
    ],
  });

  return rawClient as any;
}
