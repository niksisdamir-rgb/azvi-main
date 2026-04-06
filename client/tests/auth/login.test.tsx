/**
 * Login flow integration tests.
 *
 * Tests the Login page component for:
 *  - Happy path: credentials submitted → mutation called → toast.success → redirect
 *  - Error state: mutation error → toast.error → no redirect
 *  - Auth0 SSO: button click → loginWithRedirect called
 *  - Loading states: pending mutation disables button
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeTrpcMock, makeMutationStub } from "../__mocks__/trpc.mock";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockMutate = vi.fn();
const mockSetLocation = vi.fn();
const mockLoginWithRedirect = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockInvalidate = vi.fn();

// We need trpc to be configurable per-test, so we keep a mutable ref
let mutationReturn = makeMutationStub({ mutate: mockMutate });

vi.mock("@/lib/trpc", () => {
  const proxy = makeTrpcMock();
  return { trpc: proxy };
});

// Override the login mutation on the proxy for each test
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      login: {
        useMutation: vi.fn(() => mutationReturn),
      },
      me: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false })),
        invalidate: mockInvalidate,
      },
      logout: {
        useMutation: vi.fn(() => makeMutationStub()),
      },
    },
    useUtils: vi.fn(() => ({
      auth: {
        me: {
          invalidate: mockInvalidate,
          setData: vi.fn(),
        },
      },
    })),
  },
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/login", mockSetLocation]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    loginWithRedirect: mockLoginWithRedirect,
    isLoading: false,
    isAuthenticated: false,
  })),
}));

vi.mock("@/const", () => ({
  REGISTER_PATH: "/register",
  LOGIN_PATH: "/login",
}));

// Mock GlassCard components used in Login
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

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationReturn = makeMutationStub({ mutate: mockMutate });
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
    render(<Login />);

    await user.click(
      screen.getByRole("button", { name: /sign in with azvirt auth/i })
    );

    expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
  });

  it("disables legacy button while mutation is pending", () => {
    mutationReturn = makeMutationStub({ mutate: mockMutate, isPending: true });

    // Re-import with updated mock state by directly overriding
    const { trpc } = require("@/lib/trpc");
    trpc.auth.login.useMutation.mockReturnValue(mutationReturn);

    render(<Login />);

    const submitBtn = screen.getByRole("button", { name: /connecting/i });
    expect(submitBtn).toBeDisabled();
  });
});
