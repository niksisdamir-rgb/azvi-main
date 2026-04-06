/**
 * Employee creation form validation tests.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/trpc", () => ({
  trpc: {
    employees: {
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
      delete: {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

import Employees from "@/pages/Employees";
import { trpc } from "@/lib/trpc";

describe("Employee Creation Form", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openAddEmployeeDialog() {
    render(<Employees />);
    const addBtn = screen.getByRole("button", { name: /add employee/i });
    await user.click(addBtn);
  }

  it("renders 'Add Employee' button", () => {
    render(<Employees />);
    expect(
      screen.getByRole("button", { name: /add employee/i })
    ).toBeInTheDocument();
  });

  it("opens dialog when 'Add Employee' button clicked", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByText(/add new employee/i)).toBeInTheDocument();
  });

  it("firstName field is required", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByLabelText(/first name/i)).toBeRequired();
  });

  it("lastName field is required", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
  });

  it("employeeNumber field is required", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByLabelText(/employee number/i)).toBeRequired();
  });

  it("position field is required", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByLabelText(/^position/i)).toBeRequired();
  });

  it("optional fields (phone, email, hourlyRate) are not required", async () => {
    await openAddEmployeeDialog();
    expect(screen.getByLabelText(/phone number/i)).not.toBeRequired();
    expect(screen.getByLabelText(/^email$/i)).not.toBeRequired();
    expect(screen.getByLabelText(/hourly rate/i)).not.toBeRequired();
  });

  it("valid form submission calls mutation with correct employee data", async () => {
    const mockMutate = vi.fn();
    // Must set this BEFORE rendering, so the component's useMutation returns the mock
    vi.mocked(trpc.employees.create.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as any);

    render(<Employees />);
    const addBtn = screen.getByRole("button", { name: /add employee/i });
    await user.click(addBtn);

    await user.type(screen.getByLabelText(/first name/i), "Marko");
    await user.type(screen.getByLabelText(/last name/i), "Marković");
    await user.type(screen.getByLabelText(/employee number/i), "EMP-001");
    await user.type(screen.getByLabelText(/^position/i), "Engineer");

    // Select standard Radix Select dropdown
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);
    const option = await screen.findByRole("option", { name: /construction/i });
    await user.click(option);

    await user.type(screen.getByLabelText(/phone number/i), "+38761000111");
    await user.type(screen.getByLabelText(/^email$/i), "marko@example.com");
    await user.type(screen.getByLabelText(/hourly rate/i), "15.50");

    const submitBtn = screen.getByRole("button", { name: /^add employee$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Marko",
        lastName: "Marković",
        employeeNumber: "EMP-001",
        position: "Engineer",
        department: "construction",
        phoneNumber: "+38761000111",
        email: "marko@example.com",
        hourlyRate: 15.5,
        status: "active",
      })
    );
  });

  it("submit button shows 'Adding...' and is disabled when mutation is pending", async () => {
    vi.mocked(trpc.employees.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as any);

    await openAddEmployeeDialog();

    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
  });

  it("shows empty state text when no employees exist", () => {
    render(<Employees />);
    expect(screen.getByText(/no employees found/i)).toBeInTheDocument();
  });

  it("shows loading state text when employees are loading", () => {
    vi.mocked(trpc.employees.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    render(<Employees />);
    expect(screen.getByText(/loading employees/i)).toBeInTheDocument();
  });

  it("cancel button closes dialog without submitting", async () => {
    await openAddEmployeeDialog();

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/add new employee/i)).not.toBeInTheDocument();
    });
    expect(
      vi.mocked(trpc.employees.create.useMutation)().mutate
    ).not.toHaveBeenCalled();
  });
});
