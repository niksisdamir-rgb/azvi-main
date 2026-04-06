/**
 * Employee creation form validation tests.
 *
 * Tests the "Add Employee" dialog in the Employees page:
 *  - Dialog opens when "Add Employee" button clicked
 *  - Required fields: firstName, lastName, employeeNumber, position
 *  - Optional fields: phoneNumber, email, hourlyRate
 *  - Valid form submission calls mutation with correct employee data
 *  - Pending state: button shows "Adding..." and is disabled
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCreateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockRefetch = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    employees: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          refetch: mockRefetch,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: mockCreateMutate,
          isPending: false,
          error: null,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutate: mockDeleteMutate,
          isPending: false,
          error: null,
        })),
      },
    },
    useUtils: vi.fn(() => ({})),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import Employees from "@/pages/Employees";

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
    await openAddEmployeeDialog();

    await user.type(screen.getByLabelText(/first name/i), "Marko");
    await user.type(screen.getByLabelText(/last name/i), "Marković");
    await user.type(screen.getByLabelText(/employee number/i), "EMP-001");
    await user.type(screen.getByLabelText(/^position/i), "Engineer");
    await user.type(screen.getByLabelText(/phone number/i), "+38761000111");
    await user.type(screen.getByLabelText(/^email$/i), "marko@example.com");
    await user.type(screen.getByLabelText(/hourly rate/i), "15.50");

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /^add employee$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Marko",
        lastName: "Marković",
        employeeNumber: "EMP-001",
        position: "Engineer",
        phoneNumber: "+38761000111",
        email: "marko@example.com",
        hourlyRate: 15.5,
        status: "active",
      })
    );
  });

  it("submit button shows 'Adding...' and is disabled when mutation is pending", async () => {
    const { trpc } = await import("@/lib/trpc");
    vi.mocked(trpc.employees.create.useMutation).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: true,
      error: null,
    } as any);

    await openAddEmployeeDialog();

    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
  });

  it("shows empty state text when no employees exist", () => {
    render(<Employees />);
    expect(
      screen.getByText(/no employees found/i)
    ).toBeInTheDocument();
  });

  it("shows loading state text when employees are loading", () => {
    const { trpc } = require("@/lib/trpc");
    vi.mocked(trpc.employees.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetch,
    });

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
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });
});
