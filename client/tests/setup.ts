import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ── Browser API stubs ────────────────────────────────────────────────────────

// ResizeObserver – needed by many Radix UI / chart components
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// matchMedia – needed by next-themes and media-query hooks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver – needed by framer-motion, input-otp, and virtual lists
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
}
globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// scrollIntoView – missing in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// pointer capture – needed by Radix slider / other interactive primitives
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);

// Notification API – needed by Settings page push subscription feature
if (typeof globalThis.Notification === "undefined") {
  Object.defineProperty(globalThis, "Notification", {
    writable: true,
    configurable: true,
    value: class MockNotification {
      static permission: string = "default";
      static requestPermission = vi.fn().mockResolvedValue("granted");
      constructor(title: string, options?: object) {}
    },
  });
}
