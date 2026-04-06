import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { AdminRoute } from '../src/components/AdminRoute';
import { useAuth } from '../src/hooks/useAuth';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock wouter Redirect
vi.mock('wouter', () => ({
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));

describe('Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated user accessing /materials to /login', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="materials-page">Materials Content</div>
        </ProtectedRoute>
      );

      // Verify redirect occurs and is sent to /login
      const redirect = screen.getByTestId('redirect');
      expect(redirect).not.toBeNull();
      expect(redirect.textContent).toBe('/login');
      expect(screen.queryByTestId('materials-page')).toBeNull();
    });

    it('renders children if authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, role: 'user' } as any,
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="materials-page">Materials Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('materials-page')).not.toBeNull();
      expect(screen.queryByTestId('redirect')).toBeNull();
    });
  });

  describe('AdminRoute', () => {
    it('redirects non-admin user accessing /settings to /', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, role: 'user' } as any,
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <AdminRoute>
          <div data-testid="settings-page">Settings Content</div>
        </AdminRoute>
      );

      const redirect = screen.getByTestId('redirect');
      expect(redirect).not.toBeNull();
      expect(redirect.textContent).toBe('/');
      expect(screen.queryByTestId('settings-page')).toBeNull();
    });

    it('renders children if admin user accesses /settings', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 2, role: 'admin' } as any,
        loading: false,
        isAuthenticated: true,
        error: null,
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      render(
        <AdminRoute>
          <div data-testid="settings-page">Settings Content</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('settings-page')).not.toBeNull();
      expect(screen.queryByTestId('redirect')).toBeNull();
    });
  });
});
