import { render, screen } from "@testing-library/react";
import Navbar from "../components/Navbar";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

describe("Navbar", () => {
  it("renders MoneyMap brand", () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/MoneyMap/i)).toBeInTheDocument();
  });

  it("shows login when not logged in", () => {
    localStorage.getItem = () => null;

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  it("shows logout when user is logged in", () => {
    localStorage.getItem = () => "token";

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});