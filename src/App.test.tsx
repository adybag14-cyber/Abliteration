import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { App } from "@/App";

const nightlyArchives = [
  {
    file: "abliterate-cxx-windows-x64-msvc.zip",
    href: "https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-x64-msvc.zip",
  },
  {
    file: "abliterate-cxx-linux-x64-gcc15.tar.gz",
    href: "https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-x64-gcc15.tar.gz",
  },
  {
    file: "abliterate-cxx-macos-arm64-llvm.tar.gz",
    href: "https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-macos-arm64-llvm.tar.gz",
  },
] as const;

function expectNightlyArchives(container: HTMLElement = document.body) {
  const view = within(container);
  for (const { file, href } of nightlyArchives) {
    expect(view.getByRole("link", { name: new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toHaveAttribute("href", href);
  }
  expect(container.querySelectorAll('a[href$="abliterate-cxx-windows-x64.tar.gz"]')).toHaveLength(0);
  expect(view.queryByRole("link", { name: /abliterate-cxx-windows-x64\.tar\.gz$/i })).not.toBeInTheDocument();
}

describe("Abliteration Field Guide", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders the beginner-first information architecture", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Abliteration.*without the fog/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /C\+\+26.*toy[-\s]?lab|toy[-\s]?lab.*C\+\+26/i })).toHaveAttribute("href", "#lab");
    expect(screen.getByRole("link", { name: /Find my path/i })).toHaveAttribute("href", "#path");
    expect(screen.getByRole("heading", { name: /Six steps/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Compare the shape/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /A checkpoint passes all gates/i })).toBeInTheDocument();
    expect(screen.getAllByText(/guide\s*→\s*doctor\s*→\s*self-check\s*→\s*demo/).length).toBeGreaterThanOrEqual(1);

    const journey = document.querySelector("ol");
    expect(journey?.querySelector("li")?.textContent).toMatch(/Hour 0/);
    expect(journey?.querySelector("li")?.textContent).toMatch(/C\+\+26|toy[-\s]?lab/i);

    const lab = document.getElementById("lab");
    expect(lab).not.toBeNull();
    const labMargin = Number.parseFloat(getComputedStyle(lab!).scrollMarginTop || "0");
    expect(lab!.className.includes("scroll-mt-36") || labMargin >= 144).toBe(true);
  });

  it("changes the recommended path from beginner choices", async () => {
    const user = userEvent.setup();
    render(<App />);
    const lab = document.getElementById("lab")!;
    const path = document.getElementById("path")!;
    expect(within(lab).getByRole("heading", { name: "C++26 toy-matrix lab" })).toBeInTheDocument();
    expect(within(path).getByRole("heading", { name: "Hour 0 · C++26 start" })).toBeInTheDocument();
    expectNightlyArchives(lab);

    await user.click(screen.getByRole("button", { name: /12–16 GB/i }));
    expect(screen.getByRole("heading", { name: "Residual-hook prototype" })).toBeInTheDocument();
    expect(within(lab).getByRole("heading", { name: "C++26 toy-matrix lab" })).toBeInTheDocument();
    expectNightlyArchives(lab);

    await user.click(screen.getByRole("button", { name: /24 GB\+/i }));
    await user.click(screen.getByRole("button", { name: /MoE\s*Routed experts/i }));
    await user.click(screen.getByRole("button", { name: "Create a candidate" }));
    expect(within(path).getByRole("heading", { name: "Router-aware MoE path" })).toBeInTheDocument();
    expect(path).toHaveTextContent("T08 + T31");
    expect(within(lab).getByRole("heading", { name: "C++26 toy-matrix lab" })).toBeInTheDocument();
    expectNightlyArchives(lab);
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
    const atlas = within(document.getElementById("techniques")!);
    const search = screen.getByRole("textbox", { name: "Search techniques" });

    await user.type(search, "router");
    expect(atlas.getByRole("heading", { name: "Router-weighted MoE diagnostics" })).toBeInTheDocument();
    expect(atlas.queryByRole("heading", { name: /Mean-difference DIM/ })).not.toBeInTheDocument();
    expect(atlas.queryByText("T08")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "DIM");
    expect(atlas.getByRole("heading", { name: /Mean-difference DIM/ })).toBeInTheDocument();
    expect(atlas.queryByRole("heading", { name: /False-refusal/ })).not.toBeInTheDocument();
    expect(atlas.queryByText("T38")).not.toBeInTheDocument();
    expect(within(document.getElementById("path")!).getByRole("heading", { name: "Hour 0 · C++26 start" })).toBeInTheDocument();
    expect(within(document.getElementById("lab")!).getByRole("heading", { name: "C++26 toy-matrix lab" })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "ORBA");
    expect(atlas.getByRole("heading", { name: /ORBA/ })).toBeInTheDocument();
    expect(atlas.getByText("T34")).toBeInTheDocument();
    expect(atlas.queryByText("T36")).not.toBeInTheDocument();
    expect(atlas.queryByRole("heading", { name: /COSMIC/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "COSMIC");
    expect(atlas.getByRole("heading", { name: /COSMIC/ })).toBeInTheDocument();
    expect(atlas.getByText("T36")).toBeInTheDocument();
    expect(atlas.queryByText("T34")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "T08");
    expect(atlas.getByRole("heading", { name: "MoE per-expert edit" })).toBeInTheDocument();
    expect(atlas.getByText("T08")).toBeInTheDocument();
    expect(atlas.queryByText("T31")).not.toBeInTheDocument();
    expect(atlas.queryByRole("heading", { name: "Router-weighted MoE diagnostics" })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "T31");
    expect(atlas.getByRole("heading", { name: "Router-weighted MoE diagnostics" })).toBeInTheDocument();
    expect(atlas.getByText("T31")).toBeInTheDocument();
    expect(atlas.queryByText("T08")).not.toBeInTheDocument();
    expect(atlas.queryByRole("heading", { name: "MoE per-expert edit" })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "T04");
    expect(atlas.queryByText(/^T\d{2}$/)).not.toBeInTheDocument();
    expect(atlas.getByText(/No card matches|Try .{0,80}T-ID shown on a card/)).toBeInTheDocument();
  });

  it("expands the no-GPU FAQ toward the C++26 toy lab", async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole("button", { name: "I have no GPU" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.closest("[data-slot='accordion-item']")).toHaveTextContent(/C\+\+26|cxx-nightly|toy[-\s]?lab/i);
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
