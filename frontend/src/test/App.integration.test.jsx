import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { describe, it, expect, vi } from "vitest";

// Mock API
vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(() =>
      Promise.resolve({
        data: { accessToken: "fake-token" },
      })
    ),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Full App Integration", () => {
  it("navigates to login and triggers dashboard redirect", async () => {
    render(<App />);

    // go to login
    fireEvent.click(screen.getByRole("link", { name: /login/i }));

    // fill form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    // submit
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // check navigation happened
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});