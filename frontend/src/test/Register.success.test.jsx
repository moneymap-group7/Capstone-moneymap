import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { describe, it, expect } from "vitest";

describe("Register Success", () => {
  it("submits register form", () => {
    render(<BrowserRouter><Register /></BrowserRouter>);

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