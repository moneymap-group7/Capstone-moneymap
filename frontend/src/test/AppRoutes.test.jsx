import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "../routes/AppRoutes";
import { describe, it, expect } from "vitest";

describe("AppRoutes", () => {
  it("renders landing page on /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/see where your money goes/i)).toBeInTheDocument();
  });

  it("redirects unknown route to landing", () => {
    render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/see where your money goes/i)).toBeInTheDocument();
  });
});