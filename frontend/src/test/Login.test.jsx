import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import { describe, it, expect, vi } from "vitest";

// mock API once at top
vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../services/api";

describe("Login", () => {
  it("shows error when fields are empty", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.getByText(/Email and password are required/i)
    ).toBeInTheDocument();
  });

  it("shows error for invalid email", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.getByText(/Please enter a valid email/i)
    ).toBeInTheDocument();
  });

  it("shows error when backend fails", async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});