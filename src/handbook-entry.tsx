import { createRoot, hydrateRoot } from "react-dom/client";
import { HandbookApp } from "./handbook/HandbookApp";
import type { HandbookBootstrap } from "./handbook/types";
import "./index.css";
import "./handbook/handbook.css";

const root = document.getElementById("root")!;
const payload = document.getElementById("handbook-data");
if (payload) {
  const boot: HandbookBootstrap = JSON.parse(payload.textContent || "{}");
  // The article is already present in the static HTML. Reuse it so the same
  // potentially large chapter does not have to travel twice in each response.
  if (boot.chapter)
    boot.chapter.html =
      document.getElementById("chapter-content")?.innerHTML || "";
  hydrateRoot(root, <HandbookApp boot={boot} />, {
    identifierPrefix: "handbook-",
  });
} else {
  // Vite development uses the same compiled chapter data as the static build.
  fetch(`${import.meta.env.BASE_URL}__handbook/content.json`)
    .then((response) => {
      if (!response.ok)
        throw new Error(
          "Run npm run handbook:prepare before starting the reader.",
        );
      return response.json();
    })
    .then((data) => {
      const route = window.location.pathname
        .slice(import.meta.env.BASE_URL.length)
        .replace(/index\.html$/, "");
      const chapter =
        data.documents.find(
          (entry: { route: string }) => entry.route === route,
        ) || null;
      if (route !== "handbook/" && route !== "handbook.html" && !chapter)
        throw new Error("This chapter does not exist.");
      const boot: HandbookBootstrap = {
        ...data,
        chapter,
        canonical: window.location.href,
        searchUrl: `${import.meta.env.BASE_URL}__handbook/search-index.json`,
      };
      document.title = `${chapter?.title || "Research library"} | Abliteration Handbook`;
      createRoot(root, { identifierPrefix: "handbook-" }).render(
        <HandbookApp boot={boot} />,
      );
    })
    .catch((error) => {
      root.textContent = error.message;
    });
}
