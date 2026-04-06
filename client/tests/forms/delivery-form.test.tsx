/**
 * Delivery creation form validation tests.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
// IMPORTANT: vi.mock factories are hoisted to the top of the file by vitest.
// Variables defined above vi.mock are NOT accessible inside the factory.
// Use vi.fn() directly inside the factory instead.

vi.mock("@/lib/trpc", () => ({
  trpc: {
    deliveries: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      deliveries: {
        list: {
          cancel: vi.fn().mockResolvedValue(undefined),
          getData: vi.fn().mockReturnValue([]),
          setData: vi.fn(),
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/deliveries", vi.fn()]),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

vi.mock("@/components/LiveDeliveryMap", () => ({
  LiveDeliveryMap: () => <div data-testid="map" />,
}));

vi.mock("@/components/DeliveryAnalyticsDashboard", () => ({
  DeliveryAnalyticsDashboard: () => <div data-testid="analytics" />,
}));

vi.mock("@/components/DeliveryNote", () => ({
  DeliveryNote: () => <div data-testid="delivery-note" />,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import Deliveries from "@/pages/Deliveries";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

describe("Delivery Creation Form", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openCreateDialog() {
    render(<Deliveries />);
    const addButton = screen.getByRole("button", { name: /nova isporuka/i });
    await user.click(addButton);
  }

  it("renders 'Nova Isporuka' button to trigger the form dialog", () => {
    render(<Deliveries />);
    expect(
      screen.getByRole("button", { name: /nova isporuka/i })
    ).toBeInTheDocument();
  });

  it("opens dialog on button click", async () => {
    await openCreateDialog();
    expect(screen.getByText(/zakaži novu isporuku/i)).toBeInTheDocument();
  });

  it("required fields have the required attribute", async () => {
    await openCreateDialog();

    expect(screen.getByLabelText(/projekat/i)).toBeRequired();
    expect(screen.getByLabelText(/tip betona/i)).toBeRequired();
    expect(screen.getByLabelText(/količina/i)).toBeRequired();
    expect(screen.getByLabelText(/zakazano vrijeme/i)).toBeRequired();
  });

  it("optional fields (driverName, vehicleNumber) are not required", async () => {
    await openCreateDialog();

    expect(screen.getByLabelText(/vozač/i)).not.toBeRequired();
    expect(screen.getByLabelText(/vozilo/i)).not.toBeRequired();
  });

  it("valid submission calls createMutation.mutate with correct data", async () => {
    // Get the mock mutate from the mocked module
    const mockMutate = vi.fn();
    vi.mocked(trpc.deliveries.create.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as any);

    await openCreateDialog();

    await user.type(screen.getByLabelText(/projekat/i), "Tower A");
    await user.type(screen.getByLabelText(/tip betona/i), "C30/37");
    await user.type(screen.getByLabelText(/količina/i), "25");
    fireEvent.change(screen.getByLabelText(/zakazano vrijeme/i), {
      target: { value: "2026-05-01T08:00" },
    });
    await user.type(screen.getByLabelText(/vozač/i), "Ivan Ivanić");
    await user.type(screen.getByLabelText(/vozilo/i), "BA123AB");

    await user.click(screen.getByRole("button", { name: /zakaži isporuku/i }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectName: "Tower A",
        concreteType: "C30/37",
        volume: 25,
        driverName: "Ivan Ivanić",
        vehicleNumber: "BA123AB",
      })
    );
  });

  it("submit button shows pending label when mutation is in progress", async () => {
    vi.mocked(trpc.deliveries.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as any);

    await openCreateDialog();

    const pendingBtn = screen.getByRole("button", { name: /spašavanje/i });
    expect(pendingBtn).toBeInTheDocument();
    expect(pendingBtn).toBeDisabled();
  });

  it("shows 'Nema kreiranih isporuka' empty state when no deliveries", () => {
    render(<Deliveries />);
    expect(screen.getByText(/nema kreiranih isporuka/i)).toBeInTheDocument();
  });
});
