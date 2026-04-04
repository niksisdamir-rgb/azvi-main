import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useEffect, useMemo } from "react";
import superjson from "superjson";

const queryClient = new QueryClient();

function TrpcProvider({ children }: { children: React.ReactNode }) {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();

    const trpcClient = useMemo(() => {
        return trpc.createClient({
            links: [
                httpBatchLink({
                    url: "/api/trpc",
                    transformer: superjson,
                    async fetch(input, init) {
                        const headers = new Headers(init?.headers);

                        if (isAuthenticated) {
                            try {
                                const token = await getAccessTokenSilently();
                                headers.set("Authorization", `Bearer ${token}`);
                            } catch (e) {
                                console.error("Error getting access token", e);
                            }
                        }

                        console.log(`[tRPC Request] ${input}`, { headers: Object.fromEntries(headers.entries()) });
                        const response = await globalThis.fetch(input, {
                            ...init,
                            headers,
                            credentials: "include",
                        });

                        const responseClone = response.clone();
                        try {
                            const text = await responseClone.text();
                            console.log(`[tRPC Response] ${input} Status: ${response.status}`, {
                                body: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
                                contentType: response.headers.get("content-type")
                            });
                        } catch (e) {
                            console.error(`[tRPC Response Error] Failed to read response body for ${input}`, e);
                        }

                        return response;
                    },
                }),
            ],
        });
    }, [getAccessTokenSilently, isAuthenticated]);

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

    useEffect(() => {
        if (import.meta.env.DEV && (!domain || !clientId || domain === "your-auth0-domain")) {
            console.warn(
                "Auth0 environment variables are missing or using placeholders. " +
                "Check your .env file and ensure VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID are set correctly."
            );
        }
    }, [domain, clientId]);

    const fallbackTrpcClient = useMemo(() => {
        return trpc.createClient({
            links: [
                httpBatchLink({
                    url: "/api/trpc",
                    transformer: superjson,
                }),
            ],
        });
    }, []);

    if (!domain || !clientId) {
        // console.warn("Auth0 domain or clientId missing. Falling back to local authentication.");
        return (
            <trpc.Provider client={fallbackTrpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </trpc.Provider>
        );
    }

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: audience,
            }}
            useRefreshTokens
            cacheLocation="localstorage"
        >
            <TrpcProvider>{children}</TrpcProvider>
        </Auth0Provider>
    );
}
