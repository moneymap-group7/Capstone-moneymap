import { render, screen, waitFor } from "@testing-library/react";
import Transactions from "../pages/Transactions";
import { describe, it, expect, vi } from "vitest";
import { getTransactions } from "../services/transactionService";

vi.mock("../services/transactionService", () => ({
  getTransactions: vi.fn(),
}));

describe("Transactions Page", () => {

  it("renders transactions after loading", async () => {
    getTransactions.mockResolvedValueOnce([
      { id: 1, description: "Test transaction" },
    ]);

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/test transaction/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no data", async () => {
    getTransactions.mockResolvedValueOnce([]);

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
    });
  });

});