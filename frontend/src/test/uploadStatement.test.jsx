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
      data: { message: "Upload successful" },
    });

    render(<UploadStatement />);

    const file = new File(["data"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/upload successful/i).length
      ).toBeGreaterThan(0);
    });
  });

  it("shows error on failed upload", async () => {
    uploadStatement.mockResolvedValueOnce({
      ok: false,
      message: "Upload failed",
    });

    render(<UploadStatement />);

    const file = new File(["data"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/upload failed/i).length
      ).toBeGreaterThan(0);
    });
  });

  it("shows loading state during upload", async () => {
    uploadStatement.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true }), 500)
        )
    );

    render(<UploadStatement />);

    const file = new File(["data"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    expect(
      screen.getAllByText(/uploading|loading/i).length
    ).toBeGreaterThan(0);

    await waitFor(() => {
      expect(uploadStatement).toHaveBeenCalled();
    });
  });

});