/**
 * Login flow integration tests.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      login: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
      me: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false })),
      },
      logout: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue(undefined),
          isPending: false,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      auth: {
        me: {
          invalidate: vi.fn().mockResolvedValue(undefined),
          setData: vi.fn(),
        },
      },
    })),
  },
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/login", vi.fn()]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    loginWithRedirect: vi.fn(),
    isLoading: false,
    isAuthenticated: false,
  })),
}));

vi.mock("@/const", () => ({
  REGISTER_PATH: "/register",
  LOGIN_PATH: "/login",
}));

vi.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children }: any) => <div>{children}</div>,
  GlassCardContent: ({ children }: any) => <div>{children}</div>,
  GlassCardHeader: ({ children }: any) => <div>{children}</div>,
  GlassCardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/card", () => ({
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import Login from "@/pages/Login";
import { trpc } from "@/lib/trpc";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

describe("Login Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with username, password fields and submit button", () => {
    render(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /legacy sign in/i })
    ).toBeInTheDocument();
  });

  it("renders Auth0 SSO button", () => {
    render(<Login />);
    expect(
      screen.getByRole("button", { name: /sign in with azvirt auth/i })
    ).toBeInTheDocument();
  });

  it("happy path: fills form and submits → mutation.mutate called with credentials", async () => {
    const mockMutate = vi.fn();
    vi.mocked(trpc.auth.login.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as any);

    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), "johndoe");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /legacy sign in/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      username: "johndoe",
      password: "secret123",
    });
  });

  it("calls loginWithRedirect when Auth0 SSO button is clicked", async () => {
    const mockLoginWithRedirect = vi.fn();
    vi.mocked(useAuth0).mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isLoading: false,
      isAuthenticated: false,
    } as any);

    render(<Login />);

    await user.click(
      screen.getByRole("button", { name: /sign in with azvirt auth/i })
    );

    expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
  });

  it("disables legacy button while mutation is pending", () => {
    vi.mocked(trpc.auth.login.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as any);

    render(<Login />);

    const submitBtn = screen.getByRole("button", { name: /connecting/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("Auth0 SSO button is disabled while Auth0 is loading", () => {
    vi.mocked(useAuth0).mockReturnValue({
      loginWithRedirect: vi.fn(),
      isLoading: true,
      isAuthenticated: false,
    } as any);

    render(<Login />);

    // The Auth0 button shows 'Initializing...' when isLoading is true
    const ssoBtn = screen.getByRole("button", { name: /initializing/i });
    expect(ssoBtn).toBeDisabled();
  });
});
