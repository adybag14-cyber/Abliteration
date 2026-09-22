export type LessonKind =
  | "projection"
  | "layers"
  | "routing"
  | "evidence"
  | "workflow"
  | "research"
  | "study";
export type CollectionId =
  | "foundations"
  | "guides"
  | "methods"
  | "techniques"
  | "experiments"
  | "tools"
  | "references";
export interface Collection {
  id: CollectionId;
  title: string;
  description: string;
  accent: string;
}
export interface ChapterSummary {
  source: string;
  route: string;
  title: string;
  description: string;
  collection: CollectionId;
  lesson: LessonKind;
  minutes: number;
  words: number;
  codeCount: number;
  order: number;
  archived: boolean;
}
export interface ChapterHeading {
  id: string;
  title: string;
  depth: number;
}
export interface Chapter extends ChapterSummary {
  html: string;
  sourceHash: string;
  headings: ChapterHeading[];
  related: string[];
  languages: string[];
}
export interface HandbookBootstrap {
  chapter: Chapter | null;
  catalog: ChapterSummary[];
  collections: Collection[];
  base: string;
  buildId: string;
  sourceCommit: string;
  canonical: string;
  searchUrl: string;
}
export interface SearchEntry {
  source: string;
  title: string;
  collection: CollectionId;
  text: string;
  headings: ChapterHeading[];
}
