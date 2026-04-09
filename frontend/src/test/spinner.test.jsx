import { render, screen } from "@testing-library/react";
import Spinner from "../components/common/Spinner";
import { describe, it, expect } from "vitest";

describe("Spinner", () => {
  it("renders loading label", () => {
    render(<Spinner />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("has loading text visible", () => {
    render(<Spinner />);
    expect(screen.getByText(/Loading/i)).toBeVisible();
  });
});