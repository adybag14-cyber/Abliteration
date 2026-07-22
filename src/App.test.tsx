import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { App } from "@/App";

describe("Abliteration Field Guide", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders the beginner-first information architecture", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Abliteration.*without the fog/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Find my path/i })).toHaveAttribute("href", "#path");
    expect(screen.getByRole("heading", { name: /Six steps/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Compare the shape/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /A checkpoint passes all gates/i })).toBeInTheDocument();
  });

  it("changes the recommended path from beginner choices", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Residual-hook prototype" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^No GPU/i }));
    expect(screen.getByRole("heading", { name: "Evaluation-first path" })).toBeInTheDocument();
  });

  it("stores step completion and exposes a reset", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Mark Set the boundary complete/i }));
    expect(screen.getByText("1/6 complete")).toBeInTheDocument();
    expect(localStorage.getItem("abliteration-guide-progress")).toContain("scope");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("0/6 complete")).toBeInTheDocument();
  });

  it("turns the deployment decision into a hold when gates fail", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Ready to export" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stress the gates" }));
    expect(screen.getByRole("heading", { name: "Hold this candidate" })).toBeInTheDocument();
    expect(screen.getByText(/1\/6 gates passing/i)).toBeInTheDocument();
  });

  it("filters the technique atlas", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("textbox", { name: "Search techniques" }), "router");
    expect(screen.getByRole("heading", { name: "Router-weighted MoE" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mean-difference direction" })).not.toBeInTheDocument();
  });

  it("switches themes and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("abliteration-theme")).toBe("dark");
  });

  it("updates the accessible spider diagram when a method is selected", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("radio", { name: /MoE expert edit/i }));
    expect(screen.getByRole("img", { name: /Method profile for MoE expert edit/i })).toBeInTheDocument();
  });

  it("has no serious or critical automated accessibility violations", async () => {
    const { container } = render(<App />);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    const severe = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(severe).toEqual([]);
  });
});
