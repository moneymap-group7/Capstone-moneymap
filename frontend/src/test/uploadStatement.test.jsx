import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadStatement from "../pages/UploadStatement";
import { describe, it, expect, vi } from "vitest";
import { uploadStatement } from "../services/statementService";

vi.mock("../services/statementService", () => ({
  uploadStatement: vi.fn(),
}));

describe("UploadStatement", () => {
  it("uploads file successfully", async () => {
    uploadStatement.mockResolvedValueOnce({
      ok: true,
      data: { message: "Upload successful", totalRows: 1 },
    });

    render(<UploadStatement />);

    const file = new File(["data"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /upload/i })
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Upload successful/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("shows error on failed upload", async () => {
    uploadStatement.mockResolvedValueOnce({
      ok: false,
      message: "Upload failed",
    });

    render(<UploadStatement />);

    // select file
    const file = new File(["data"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /upload/i })
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Upload failed/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});