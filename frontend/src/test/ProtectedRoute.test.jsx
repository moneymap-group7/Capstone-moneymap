import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";
import { describe, it, expect } from "vitest";

describe("ProtectedRoute", () => {
  it("redirects when token is missing", () => {
    localStorage.getItem = () => null;

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Private</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).toMatch(/Login Page/i);
  });

  it("allows access when token exists", () => {
    localStorage.getItem = () => "token";

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Private</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).toMatch(/Private/i);
  });
});