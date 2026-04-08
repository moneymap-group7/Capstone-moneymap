import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { describe, it, expect } from "vitest";

describe("Dashboard", () => {
  it("renders dashboard title", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Upload Statement/i)).toBeInTheDocument();
    expect(screen.getByText(/View Transactions/i)).toBeInTheDocument();
  });
});