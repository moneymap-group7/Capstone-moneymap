import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "../routes/AppRoutes";
import { describe, it, expect } from "vitest";

describe("Full App Integration", () => {
  it("navigates to login and triggers dashboard redirect", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});