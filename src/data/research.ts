import august from "../../sources/research/catalog-2026.json";
import september from "../../sources/research/catalog-2026-09.json";

export type ResearchPaper = {
  id: string; title: string; authors: string[]; published: string; category: string;
  area: string; url: string; snapshot: string; summary?: string; scope?: string;
  implication?: string; implementation?: string; version_url?: string;
};

export const researchPapers: ResearchPaper[] = [
  ...august.papers.map((paper) => ({ ...paper, snapshot: august.snapshot_date })),
  ...september.papers.map((paper) => ({ ...paper, snapshot: september.snapshot_date })),
].sort((a, b) => b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
export const researchSnapshots = ["All snapshots", september.snapshot_date, august.snapshot_date];
export const latestResearchDate = september.snapshot_date;
