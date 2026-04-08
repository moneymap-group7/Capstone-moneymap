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

    expect(screen.getByText(/MoneyMap/i)).toBeInTheDocument();
  });

  it("redirects unknown route to landing", () => {
    render(
      <MemoryRouter initialEntries={["/random"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/MoneyMap/i)).toBeInTheDocument();
  });
});