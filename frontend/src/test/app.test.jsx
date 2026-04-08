import { render, screen } from "@testing-library/react";
import App from "../App";
import { describe, it, expect } from "vitest";

describe("App", () => {
  it("renders navbar link only", () => {
    render(<App />);

    const links = screen.getAllByRole("link", { name: /MoneyMap/i });

    expect(links.length).toBeGreaterThan(0);
  });
});