import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import { describe, it, expect } from "vitest";

describe("Navbar", () => {

  it("renders MoneyMap brand", () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/moneymap/i)).toBeInTheDocument();
  });

  it("shows login when not logged in", () => {
    localStorage.clear();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

});