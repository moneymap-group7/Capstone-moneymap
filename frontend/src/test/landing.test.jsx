import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import { describe, it, expect } from "vitest";

describe("Landing Page", () => {
  it("renders heading", () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByText(/see where your money goes/i)).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getAllByText(/track|insights/i).length).toBeGreaterThan(0);
  });
});