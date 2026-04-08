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

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(
      screen.getAllByText(/upload statements/i).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/view transactions/i).length
    ).toBeGreaterThan(0);
  });

});