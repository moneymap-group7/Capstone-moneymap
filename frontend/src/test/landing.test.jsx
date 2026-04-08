import { render, screen } from "@testing-library/react";
import Landing from "../pages/Landing";
import { describe, it, expect } from "vitest";

describe("Landing Page", () => {
  it("renders heading", () => {
    render(<Landing />);
    expect(screen.getByText(/MoneyMap/i)).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<Landing />);
    expect(
      screen.getByText(/Upload statements/i)
    ).toBeInTheDocument();
  });
});