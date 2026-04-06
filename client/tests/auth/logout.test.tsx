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

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockLogoutMutate = vi.fn();
const mockSetData = vi.fn();
const mockInvalidate = vi.fn().mockResolvedValue(undefined);
const mockRefetch = vi.fn();
const mockAuth0Logout = vi.fn();

let isAuth0Authenticated = false;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      me: {
        useQuery: vi.fn(() => ({
          data: { id: 1, username: "testuser", role: "user" },
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        })),
      },
      logout: {
        useMutation: vi.fn(() => ({
          mutate: mockLogoutMutate,
          mutateAsync: mockMutateAsync,
          isPending: false,
          error: null,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      auth: {
        me: {
          setData: mockSetData,
          invalidate: mockInvalidate,
        },
      },
    })),
  },
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    logout: mockAuth0Logout,
    isAuthenticated: isAuth0Authenticated,
    isLoading: false,
    getAccessTokenSilently: vi.fn(),
  })),
}));

vi.mock("@/const", () => ({
  LOGIN_PATH: "/login",
}));

import { useAuth } from "@/hooks/useAuth";

describe("Logout Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuth0Authenticated = false;
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it("local logout: calls logout mutation and clears me cache", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
  });

  it("local logout: invalidates auth.me query after logout", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("Auth0 logout: calls Auth0 logout with returnTo origin when Auth0 session active", async () => {
    isAuth0Authenticated = true;
    // Re-apply the mock with updated isAuthenticated
    const { useAuth0 } = await import("@auth0/auth0-react");
    vi.mocked(useAuth0).mockReturnValue({
      logout: mockAuth0Logout,
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      getAccessTokenSilently: vi.fn(),
      user: undefined,
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuth0Logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
    // Local mutation should NOT be called when using Auth0
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("local logout: handles UNAUTHORIZED error gracefully (already logged out)", async () => {
    const { TRPCClientError } = await import("@trpc/client");
    const unauthorizedError = new TRPCClientError("UNAUTHORIZED");
    (unauthorizedError as any).data = { code: "UNAUTHORIZED" };
    mockMutateAsync.mockRejectedValue(unauthorizedError);

    const { result } = renderHook(() => useAuth());

    // Should not throw
    await act(async () => {
      await expect(result.current.logout()).resolves.not.toThrow();
    });
  });

  it("logout clears user from me cache immediately (setData called with null)", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
  });
});
