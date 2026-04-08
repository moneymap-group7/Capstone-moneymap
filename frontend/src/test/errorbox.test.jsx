import { render, screen } from "@testing-library/react";
import ErrorBox from "../components/common/ErrorBox";
import { describe, it, expect } from "vitest";

describe("ErrorBox", () => {
  it("renders errors list", () => {
    render(<ErrorBox errors={["Error 1", "Error 2"]} />);

    expect(screen.getByText("Error 1")).toBeInTheDocument();
    expect(screen.getByText("Error 2")).toBeInTheDocument();
  });
});