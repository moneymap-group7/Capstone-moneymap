import { render, screen } from "@testing-library/react";
import StatusBanner from "../components/common/StatusBanner";
import { describe, it, expect } from "vitest";

describe("StatusBanner", () => {
  it("renders message", () => {
    render(<StatusBanner message="Success!" />);
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });

  it("does not render when no message", () => {
    const { container } = render(<StatusBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders success style", () => {
    render(<StatusBanner type="success" message="Done!" />);
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });
});