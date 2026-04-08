import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { describe, it, expect, vi } from "vitest";

vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Register Success Flow", () => {
  it("registers user and redirects to login", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
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
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});