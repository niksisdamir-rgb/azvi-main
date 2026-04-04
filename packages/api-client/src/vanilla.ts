/**
 * Vanilla (no-React) convenience client.
 *
 * Uses the same typed tRPC client under the hood but exposes a stable
 * singleton pattern suitable for use in Node.js scripts, CLI tools,
 * Next.js server actions, or any non-React context.
 *
 * @example
 * ```ts
 * // node-script.ts
 * import { createVanillaClient } from "@azvirt/api-client";
 *
 * const api = createVanillaClient({ baseUrl: "http://localhost:3000" });
 *
 * const materials = await api.materials.list.query();
 * const lowStock  = await api.materials.getLowStock.query();
 * console.log(`${lowStock.length} materials below minimum stock`);
 * ```
 */
import { createApiClient, type ApiClient } from "./client";

export interface VanillaClientOptions {
  baseUrl: string;
  /**
   * Bearer token to inject as Authorization header.
   * Primarily for server-to-server calls where cookie auth is unavailable.
   */
  bearerToken?: string;
}

/** Creates a tRPC client without any React dependency. */
export function createVanillaClient(options: VanillaClientOptions): ApiClient {
  return createApiClient({
    baseUrl: options.baseUrl,
    headers: options.bearerToken
      ? () => ({ Authorization: `Bearer ${options.bearerToken}` })
      : undefined,
  });
}
