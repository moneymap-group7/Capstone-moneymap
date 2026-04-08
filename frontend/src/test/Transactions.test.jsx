import { render, screen, waitFor } from "@testing-library/react";
import Transactions from "../pages/Transactions";
import { describe, it, expect, vi } from "vitest";
import { getTransactions } from "../services/transactionService";

vi.mock("../services/transactionService", () => ({
  getTransactions: vi.fn(),
  updateTransactionCategory: vi.fn(),
}));

describe("Transactions Page", () => {
  it("renders transactions after loading", async () => {
    getTransactions.mockResolvedValueOnce({
      data: [
        {
          transactionId: "1",
          transactionDate: "2024-01-01",
          description: "Test Transaction",
          amount: 100,
          transactionType: "DEBIT",
          spendCategory: "FOOD_AND_DINING",
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<Transactions />);

    expect(
      screen.getByRole("heading", { name: /Transactions/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Test Transaction/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no data", async () => {
    getTransactions.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
    });
  });
});