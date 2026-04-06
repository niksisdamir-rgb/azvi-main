/**
 * Auth redirect integration tests.
 *
 * Tests ProtectedRoute and AdminRoute components:
 *  - Unauthenticated user on protected page → redirected to /login
 *  - Authenticated user on protected page → content rendered
 *  - Non-admin on admin route → redirected to /
 *  - Admin on admin route → content rendered
 *  - Loading state → spinner shown, no redirect/render
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("wouter", () => ({
  Redirect: ({ to }: { to: string }) => (
    <div data-testid="redirect" data-to={to}>
      Redirecting to {to}
    </div>
  ),
  useLocation: vi.fn(() => ["/", vi.fn()]),
}));

// Stub Loader2 icon so it renders something testable
vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loading-spinner" />,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Auth Redirect Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── ProtectedRoute ──────────────────────────────────────────────────────────

  describe("ProtectedRoute", () => {
    it("redirects unauthenticated user to /login", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      const redirect = screen.getByTestId("redirect");
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute("data-to", "/login");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("renders children when user is authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user" },
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    });

    it("shows spinner while auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    });

    it("redirects user with wrong role when requiredRole is set", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user" },
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="admin">
          <div data-testid="admin-content">Admin Only</div>
        </ProtectedRoute>
      );

      const redirect = screen.getByTestId("redirect");
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute("data-to", "/");
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("renders children when user has required role", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "admin" },
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="admin">
          <div data-testid="admin-content">Admin Only</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    });
  });

  // ── AdminRoute ──────────────────────────────────────────────────────────────

  describe("AdminRoute", () => {
    it("redirects non-admin authenticated user to /", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, role: "user" },
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <AdminRoute>
          <div data-testid="settings-page">Settings</div>
        </AdminRoute>
      );

      const redirect = screen.getByTestId("redirect");
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute("data-to", "/");
      expect(screen.queryByTestId("settings-page")).not.toBeInTheDocument();
    });

    it("renders children for admin user", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, role: "admin" },
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <AdminRoute>
          <div data-testid="settings-page">Settings</div>
        </AdminRoute>
      );

      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
      expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    });

    it("redirects unauthenticated user to /login via AdminRoute", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <AdminRoute>
          <div data-testid="settings-page">Settings</div>
        </AdminRoute>
      );

      const redirect = screen.getByTestId("redirect");
      expect(redirect).toBeInTheDocument();
      expect(screen.queryByTestId("settings-page")).not.toBeInTheDocument();
    });
  });
});
