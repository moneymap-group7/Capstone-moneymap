import { render, screen, fireEvent } from "@testing-library/react";
import CategoryDropdown from "../components/CategoryDropdown";
import { describe, it, expect, vi } from "vitest";

describe("CategoryDropdown", () => {
  it("renders categories", () => {
    render(
      <CategoryDropdown
        categories={["FOOD", "RENT"]}
        value="FOOD"
        onChange={() => {}}
      />
    );

    expect(screen.getByText("FOOD")).toBeInTheDocument();
    expect(screen.getByText("RENT")).toBeInTheDocument();
  });

  it("calls onChange when value changes", () => {
    const mockFn = vi.fn();

    render(
      <CategoryDropdown
        categories={["FOOD", "RENT"]}
        value="FOOD"
        onChange={mockFn}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "RENT" },
    });

    expect(mockFn).toHaveBeenCalled();
  });
});