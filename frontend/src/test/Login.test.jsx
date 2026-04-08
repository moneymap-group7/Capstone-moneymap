import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import { describe, it, expect } from "vitest";

describe("Login", () => {

  it("shows error when fields are empty", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click login without input
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Expect validation error
    expect(
      screen.getAllByText(/required/i).length
    ).toBeGreaterThan(0);
  });

  it("shows error for invalid email", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: "invalid" },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it("handles backend fail (loading state)", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // UI shows loading state instead of error
    expect(
      screen.getByRole("button", { name: /logging in/i })
    ).toBeInTheDocument();
  });

});