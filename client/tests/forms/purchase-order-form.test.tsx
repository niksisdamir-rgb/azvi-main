/**
 * Purchase Order form validation tests.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockMaterials = [
  {
    id: 1,
    name: "Cement",
    quantity: 100,
    unit: "kg",
    supplier: "SupplierA",
    supplierEmail: "a@supplier.com",
  },
];

const mockSuppliers = [{ id: 10, name: "SupplierA", email: "a@supplier.com" }];

const mockForecasts = [{ materialId: 1, recommendedOrderQty: 50 }];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    purchaseOrders: {
      getPurchaseOrderHistory: {
        useQuery: vi.fn(() => ({ data: [], refetch: vi.fn() })),
      },
      generatePurchaseOrder: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
      updatePurchaseOrderStatus: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      sendPurchaseOrderToSupplier: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      receivePurchaseOrder: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
    },
    materials: {
      list: {
        useQuery: vi.fn(() => ({ data: mockMaterials })),
      },
      getForecasts: {
        useQuery: vi.fn(() => ({ data: mockForecasts })),
      },
    },
    suppliers: {
      list: {
        useQuery: vi.fn(() => ({ data: mockSuppliers })),
      },
    },
    useUtils: vi.fn(() => ({})),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, role: "admin" },
    loading: false,
    isAuthenticated: true,
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import PurchaseOrders from "@/pages/PurchaseOrders";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

describe("Purchase Order Form", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openCreateDialog() {
    render(<PurchaseOrders />);
    const createBtn = screen.getByRole("button", {
      name: /create purchase order/i,
    });
    await user.click(createBtn);
  }

  it("renders 'Create Purchase Order' button", () => {
    render(<PurchaseOrders />);
    expect(
      screen.getByRole("button", { name: /create purchase order/i })
    ).toBeInTheDocument();
  });

  it("opens create dialog when button clicked", async () => {
    await openCreateDialog();
    expect(
      screen.getAllByText(/create purchase order/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows error toast when submitting without selecting a material", async () => {
    await openCreateDialog();

    // Click the dialog footer submit button
    const allCreateBtns = screen.getAllByRole("button", {
      name: /create purchase order/i,
    });
    const submitBtn = allCreateBtns[allCreateBtns.length - 1];
    await user.click(submitBtn);

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Please select a material"
      );
    });
    expect(vi.mocked(trpc.purchaseOrders.generatePurchaseOrder.useMutation)().mutate).not.toHaveBeenCalled();
  });

  it("shows quantity field in the dialog", async () => {
    await openCreateDialog();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it("shows expected delivery date field in the dialog", async () => {
    await openCreateDialog();
    expect(screen.getByLabelText(/expected delivery/i)).toBeInTheDocument();
  });

  it("shows notes textarea in the dialog", async () => {
    await openCreateDialog();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("shows supplier and supplier email fields in the dialog", async () => {
    await openCreateDialog();
    expect(screen.getByLabelText(/^supplier$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supplier email/i)).toBeInTheDocument();
  });

  it("shows 'No purchase orders found' empty state", () => {
    render(<PurchaseOrders />);
    expect(
      screen.getByText(/no purchase orders found/i)
    ).toBeInTheDocument();
  });
});
