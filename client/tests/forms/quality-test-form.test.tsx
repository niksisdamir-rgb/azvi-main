/**
 * Quality Test submission form validation tests.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/trpc", () => ({
  trpc: {
    qualityTests: {
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
    useUtils: vi.fn(() => ({})),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

vi.mock("@/components/MobileQCForm", () => ({
  MobileQCForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="mobile-qc-form">
      <button onClick={onSuccess}>Submit Mobile</button>
    </div>
  ),
}));

vi.mock("@/components/QCTrendsDashboard", () => ({
  QCTrendsDashboard: () => <div data-testid="qc-trends" />,
}));

vi.mock("@/components/PredictiveQcPanel", () => ({
  PredictiveQcPanel: () => <div data-testid="predictive-qc" />,
}));

vi.mock("@/components/ComplianceCertificate", () => ({
  ComplianceCertificate: () => <div data-testid="compliance" />,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import QualityControl from "@/pages/QualityControl";
import { trpc } from "@/lib/trpc";

describe("Quality Test Submission Form", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openRecordTestDialog() {
    render(<QualityControl />);
    const recordBtn = screen.getByRole("button", { name: /record test/i });
    await user.click(recordBtn);
  }

  it("renders 'Record Test' button", () => {
    render(<QualityControl />);
    expect(
      screen.getByRole("button", { name: /record test/i })
    ).toBeInTheDocument();
  });

  it("opens dialog with form when 'Record Test' clicked", async () => {
    await openRecordTestDialog();
    expect(screen.getByText(/record quality test/i)).toBeInTheDocument();
  });

  it("testName field is required", async () => {
    await openRecordTestDialog();
    expect(screen.getByLabelText(/test name/i)).toBeRequired();
  });

  it("result field is required", async () => {
    await openRecordTestDialog();
    expect(screen.getByLabelText(/^result$/i)).toBeRequired();
  });

  it("valid submission calls mutation with correct form data", async () => {
    const mockMutate = vi.fn();
    vi.mocked(trpc.qualityTests.create.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as any);

    await openRecordTestDialog();

    await user.type(screen.getByLabelText(/test name/i), "Compressive Strength Test");
    await user.type(screen.getByLabelText(/^result$/i), "35");
    await user.type(screen.getByLabelText(/unit/i), "MPa");
    await user.type(screen.getByLabelText(/tested by/i), "Lab Tech 1");

    const submitBtn = screen.getByRole("button", { name: /^record test$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        testName: "Compressive Strength Test",
        result: "35",
        unit: "MPa",
        testedBy: "Lab Tech 1",
      })
    );
  });

  it("status field defaults to 'pending'", async () => {
    await openRecordTestDialog();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("submit button shows 'Recording...' and is disabled when pending", async () => {
    vi.mocked(trpc.qualityTests.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as any);

    await openRecordTestDialog();

    expect(screen.getByRole("button", { name: /recording/i })).toBeDisabled();
  });

  it("shows 'No test results found' empty state when no tests", () => {
    render(<QualityControl />);
    expect(
      screen.getByText(/no test results found/i)
    ).toBeInTheDocument();
  });
});
