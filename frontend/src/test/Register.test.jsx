import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { describe, it, expect, vi } from "vitest";

// mock API once
vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../services/api";

describe("Register", () => {
  it("shows error for empty form", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    expect(
      screen.getByText(/Full name is required/i)
    ).toBeInTheDocument();
  });

  it("shows password validation error", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    expect(
      screen.getByText(/Password must be at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it("shows error if email already exists", async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 409 },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });
});