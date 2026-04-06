/**
 * Logout flow integration tests.
 *
 * Tests the useAuth hook's logout behaviour:
 *  - Local session logout: fires trpc.auth.logout mutation, clears me cache
 *  - Auth0 logout: when Auth0 session active, calls Auth0 logout with returnTo
 *  - Cache cleared on success: utils.auth.me.setData called with null
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── vi.mock declarations ─────────────────────────────────────────────────────
// All vi.mock factories are hoisted to top of file by vitest.
// Variables declared with var/const before vi.mock are NOT accessible inside.
// We use vi.fn() inline inside factories and retrieve mocks via import.

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      me: {
        useQuery: vi.fn(() => ({
          data: { id: 1, username: "testuser", role: "user" },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })),
      },
      logout: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void }) => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(async () => {
            opts?.onSuccess?.();
          }),
          isPending: false,
          error: null,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      auth: {
        me: {
          setData: vi.fn(),
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    })),
  },
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    logout: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    getAccessTokenSilently: vi.fn(),
  })),
}));

vi.mock("@/const", () => ({
  LOGIN_PATH: "/login",
}));

// ── Import after vi.mock declarations ─────────────────────────────────────────

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAuth0 } from "@auth0/auth0-react";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Logout Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default implementations after clearAllMocks
    vi.mocked(trpc.auth.logout.useMutation).mockImplementation(
      (opts?: { onSuccess?: () => void }) => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(async () => {
          opts?.onSuccess?.();
        }),
        isPending: false,
        error: null,
      }) as any
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      auth: {
        me: {
          setData: vi.fn(),
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as any);
    vi.mocked(trpc.auth.me.useQuery).mockReturnValue({
      data: { id: 1, username: "testuser", role: "user" },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useAuth0).mockReturnValue({
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      getAccessTokenSilently: vi.fn(),
    } as any);
  });

  it("local logout: calls logout mutateAsync once", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(trpc.auth.logout.useMutation).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  it("local logout: clears me cache via setData(undefined, null) in finally block", async () => {
    const mockSetData = vi.fn();
    vi.mocked(trpc.useUtils).mockReturnValue({
      auth: {
        me: {
          setData: mockSetData,
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
  });

  it("local logout: invalidates auth.me query after logout", async () => {
    const mockInvalidate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(trpc.useUtils).mockReturnValue({
      auth: {
        me: {
          setData: vi.fn(),
          invalidate: mockInvalidate,
        },
      },
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("Auth0 logout: calls Auth0 logout with returnTo origin when Auth0 session active", async () => {
    const mockAuth0Logout = vi.fn();
    vi.mocked(useAuth0).mockReturnValue({
      logout: mockAuth0Logout,
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
    } as any);

    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(trpc.auth.logout.useMutation).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuth0Logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
    // Local mutation NOT called when Auth0 session
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("local logout: handles UNAUTHORIZED TRPCClientError gracefully", async () => {
    const { TRPCClientError } = await import("@trpc/client");
    const unauthorizedError = new TRPCClientError("UNAUTHORIZED");
    (unauthorizedError as any).data = { code: "UNAUTHORIZED" };

    vi.mocked(trpc.auth.logout.useMutation).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(unauthorizedError),
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth());

    // Should resolve without throwing
    await act(async () => {
      await expect(result.current.logout()).resolves.toBeUndefined();
    });
  });
});
