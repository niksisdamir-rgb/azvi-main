/**
 * AzVirt DMS — API Client
 * ========================
 * Type-safe tRPC client factory.
 * Works in any JavaScript/TypeScript runtime — React, Node.js, plain browser scripts.
 *
 * Usage (vanilla):
 *   import { createApiClient } from "@azvirt/api-client";
 *   const api = createApiClient({ baseUrl: "http://localhost:3000" });
 *   const user = await api.auth.me.query();
 *
 * Usage (React — full autocomplete + React Query):
 *   import { useApi } from "@azvirt/api-client/react";
 *   const { data } = useApi().auth.me.useQuery();
 */

export { createApiClient } from "./client";
export type { ApiClient, ApiClientOptions } from "./client";
export { createVanillaClient } from "./vanilla";
export type { VanillaClientOptions } from "./vanilla";
