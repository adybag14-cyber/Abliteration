import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectiveLab } from "./selective-lab";
import { ResearchExplorer } from "./research-explorer";

describe("selective research controls", () => {
  it("plans exact tensor selections and prevents an empty command", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<SelectiveLab />);
    expect(screen.getByTestId("selected-tensor-count")).toHaveTextContent("4 / 219");
    expect(screen.getByText("1.89", { exact: false })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Layer 10$/ }));
    expect(screen.getByTestId("selected-tensor-count")).toHaveTextContent("2 / 219");
    await user.click(screen.getByRole("checkbox", { name: "o_proj" }));
    expect(screen.getByTestId("selected-tensor-count")).toHaveTextContent("1 / 219");
    await user.selectOptions(screen.getByLabelText("Operator"), "norm-preserving");
    await user.click(screen.getByRole("button", { name: "Copy edit commands" }));
    expect(writeText.mock.calls[0][0]).toContain("--layers 11 --modules down_proj");
    expect(writeText.mock.calls[0][0]).toContain("--mode norm-preserving");
    await user.click(screen.getByRole("button", { name: "Clear layers" }));
    expect(screen.getByRole("button", { name: "Copy edit commands" })).toBeDisabled();
  });

  it("labels paper references separately from implemented methods", async () => {
    const user = userEvent.setup(); render(<SelectiveLab />);
    await user.click(screen.getByRole("tab", { name: "Understand the methods" }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: "LoMC" })).toBeVisible();
    expect(within(panel).getByText(/not a dense MiniCPM reproduction/)).toBeInTheDocument();
    expect(within(panel).getByText(/This is not LoRA/)).toBeInTheDocument();
  });

  it("preserves the August snapshot and compares versioned new references", async () => {
    const user = userEvent.setup(); render(<ResearchExplorer />);
    expect(screen.getByText(/64 papers match/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Catalog snapshot"), "2026-08-23");
    expect(screen.getByText(/50 papers match/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Catalog snapshot"), "2026-09-22");
    expect(screen.getByText(/14 papers match/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Search titles/), "2609.16204");
    await user.click(screen.getByRole("button", { name: "Compare 2609.16204" }));
    expect(screen.getByRole("heading", { name: "Compare research scope (1/3)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear comparison" }));
    expect(screen.queryByRole("heading", { name: /Compare research scope/ })).not.toBeInTheDocument();
  });
});
