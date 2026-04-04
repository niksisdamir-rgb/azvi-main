import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardWidgets } from "./useDashboardWidgets";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useDashboardWidgets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize with default widgets", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    expect(result.current.widgets).toBeDefined();
    expect(result.current.widgets.length).toBeGreaterThan(0);
    expect(result.current.widgets[0]).toHaveProperty("id");
    expect(result.current.widgets[0]).toHaveProperty("title");
    expect(result.current.widgets[0]).toHaveProperty("visible");
  });

  it("should toggle widget visibility", () => {
    const { result } = renderHook(() => useDashboardWidgets());
    const firstWidgetId = result.current.widgets[0].id;
    const initialVisibility = result.current.widgets[0].visible;

    act(() => {
      result.current.toggleWidgetVisibility(firstWidgetId);
    });

    expect(result.current.widgets[0].visible).toBe(!initialVisibility);
  });

  it("should reorder widgets", () => {
    const { result } = renderHook(() => useDashboardWidgets());
    const originalOrder = result.current.widgets.map((w) => w.id);

    act(() => {
      const reordered = [...result.current.widgets];
      [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
      result.current.reorderWidgets(reordered);
    });

    const newOrder = result.current.widgets.map((w) => w.id);
    expect(newOrder[0]).toBe(originalOrder[1]);
    expect(newOrder[1]).toBe(originalOrder[0]);
  });

  it("should update widget properties", () => {
    const { result } = renderHook(() => useDashboardWidgets());
    const firstWidgetId = result.current.widgets[0].id;

    act(() => {
      result.current.updateWidget(firstWidgetId, { width: "half" });
    });

    expect(result.current.widgets[0].width).toBe("half");
  });

  it("should reset to default layout", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.toggleWidgetVisibility(result.current.widgets[0].id);
      result.current.updateWidget(result.current.widgets[0].id, { width: "half" });
    });

    act(() => {
      result.current.resetToDefault();
    });

    expect(result.current.widgets[0].visible).toBe(true);
    expect(result.current.widgets[0].width).toBe("quarter");
  });

  it("should apply preset layouts", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.applyLayout("manager");
    });

    expect(result.current.widgets).toBeDefined();
    expect(result.current.widgets.length).toBeGreaterThan(0);
  });

  it("should save and retrieve custom layouts", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.saveCurrentLayout("My Custom Layout");
    });

    expect(result.current.layouts["my custom layout"]).toBeDefined();
    expect(result.current.layouts["my custom layout"].name).toBe("My Custom Layout");
  });

  it("should delete custom layouts", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.saveCurrentLayout("Temp Layout");
    });

    expect(result.current.layouts["temp layout"]).toBeDefined();

    act(() => {
      result.current.deleteLayout("temp layout");
    });

    expect(result.current.layouts["temp layout"]).toBeUndefined();
  });

  it("should return only visible widgets", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.toggleWidgetVisibility(result.current.widgets[0].id);
    });

    const visibleCount = result.current.visibleWidgets.length;
    const totalCount = result.current.widgets.length;

    expect(visibleCount).toBe(totalCount - 1);
    expect(result.current.visibleWidgets.every((w) => w.visible)).toBe(true);
  });

  it("should persist widgets to localStorage", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      result.current.toggleWidgetVisibility(result.current.widgets[0].id);
    });

    const stored = localStorage.getItem("azvirt_dashboard_layout");
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    expect(parsed[0].visible).toBe(false);
  });

  it("should load widgets from localStorage", () => {
    const customConfig = [
      { id: "test", title: "Test Widget", visible: false, width: "half" as const, order: 0 },
    ];

    localStorage.setItem("azvirt_dashboard_layout", JSON.stringify(customConfig));

    const { result } = renderHook(() => useDashboardWidgets());

    // Wait for loading to complete
    expect(result.current.isLoading).toBe(false);
  });

  it("should maintain widget order after reordering", () => {
    const { result } = renderHook(() => useDashboardWidgets());

    act(() => {
      const reordered = [...result.current.widgets].reverse();
      result.current.reorderWidgets(reordered);
    });

    result.current.widgets.forEach((widget, idx) => {
      expect(widget.order).toBe(idx);
    });
  });
});
