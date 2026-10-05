import august from "../../sources/research/catalog-2026.json";
import september from "../../sources/research/catalog-2026-09.json";
import october from "../../sources/research/catalog-2026-10.json";

export type ResearchPaper = {
  id: string; title: string; authors: string[]; published: string; category: string;
  area: string; url: string; snapshot: string; summary?: string; scope?: string;
  implication?: string; implementation?: string; version_url?: string;
  limitations?: string; code_status?: string;
};

export const researchPapers: ResearchPaper[] = [
  ...august.papers.map((paper) => ({ ...paper, snapshot: august.snapshot_date })),
  ...september.papers.map((paper) => ({ ...paper, snapshot: september.snapshot_date })),
  ...october.papers.map((paper) => ({ ...paper, snapshot: october.snapshot_date })),
].sort((a, b) => b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
export const researchSnapshots = ["All snapshots", october.snapshot_date, september.snapshot_date, august.snapshot_date];
export const latestResearchDate = october.snapshot_date;
export const latestResearchGuide = "docs/research-october-2026.md";
