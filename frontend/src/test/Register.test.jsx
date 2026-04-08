import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { describe, it, expect } from "vitest";

describe("Register", () => {

  it("shows error for empty form", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getAllByText(/required/i).length
    ).toBeGreaterThan(0);
  });

  it("shows password validation error", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/create a password/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getAllByText(/at least/i).length
    ).toBeGreaterThan(0);
  });

  it("handles duplicate email submission (loading state)", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/create a password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getByRole("button", { name: /creating/i })
    ).toBeInTheDocument();
  });

});