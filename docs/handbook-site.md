# The published research handbook

The [handbook library](https://adybag14-cyber.github.io/Abliteration/handbook/) gives each public chapter its own reading page. Markdown remains the editable source: researchers can read the website, link to a section, or inspect the exact source revision behind the page.

## Find a chapter

Browse the seven collections, filter the library by title or topic, or open search with **Ctrl K** on Windows/Linux and **Command K** on macOS. Search loads the complete text index into the browser and does not send queries to a server. The complete text index at the bottom of the library also works without JavaScript.

Each page provides grouped navigation, a table of contents, related chapters, and previous/next links. Small screens use a navigation drawer and an expandable table of contents. All chapter routes are actual static HTML files, so direct links and browser refreshes work on GitHub Pages.

## Use the reading controls

- **Save chapter** keeps a bookmark in this browser.
- **Copy link** copies the permanent chapter URL.
- **Reading density** changes article text size.
- **Wrap code** switches between horizontal scrolling and wrapped examples.
- Each code example has a copy button. The copied text is the source example, without syntax-highlighting markup.
- Personal section checkpoints record which sections you reviewed. A source change starts a fresh checklist for that chapter.
- The theme button supports light and dark reading. Printing focuses on the chapter and its source information.

Preferences and progress use local browser storage. They do not synchronize between devices. The complete source chapter and native links remain available without JavaScript; interactive controls need JavaScript.

## Work with visual companions

Companions add a learning aid above the complete source chapter. They load when opened:

| Companion | What it demonstrates |
| --- | --- |
| Vector geometry | A two-dimensional projection with direction and strength controls; an illustration, not a model measurement |
| Selective edit planner | MiniCPM5 tensor and parameter budgets for selected layers and projection families |
| Routing coverage | The share of a fixed illustrative routing distribution touched by a selected expert set |
| Chapter map | The chapter's own section order with direct navigation |
| Evaluation gates | Evidence and comparison requirements from the field guide |
| Research explorer | Search and compare the preserved primary-source catalog |
| MiniCPM5 results | The recorded pilot and study results, with denominators and uncertainty |

Source Mermaid diagrams are rendered to light/dark SVGs during the build. Their original notation remains inspectable next to the figure. Existing papers, historical guidance, and original Markdown are retained; presentation does not establish that every described method has been reproduced.

## Add or update a chapter

Edit the Markdown in `docs/`, `instructions/`, `methods/`, `techniques/`, `cxx/`, or the maintained `sources/` collection. The root overview, tool index, bibliography, contribution guide, and security policy are included too. Build directories, hidden directories, and the vendored Zig compiler are excluded.

The route follows the source path. For example, `docs/evaluation.md` becomes `/Abliteration/handbook/docs/evaluation/`. The root `README.md` becomes `/Abliteration/handbook/overview/`. Links to included Markdown files are rewritten to their reading pages; code, datasets, and downloads keep their repository destinations.

```bash
npm ci
npm run test:handbook
npm run build
npm run test:e2e
```

Use `npm run dev` to preview the field guide and handbook together. Restart it after changing Markdown to refresh the compiled content. Changes to reader components update through Vite as usual.

The reader uses source-owned shadcn/ui components, Radix primitives, and the existing site design tokens. The component registry sources are recorded in `data/handbook/ui-provenance.json`. Markdown parsing, sanitization, highlighting, and Mermaid rendering run only during the build. A changed diagram needs Playwright Chromium installed with `npx playwright install chromium`; unchanged diagram assets are cached in `public/handbook-media/`.

## Verify the published result

The build checks source fingerprints, exact code examples, unique headings, internal pages and section links, structured metadata, CSP hashes, and size budgets. Browser tests cover direct routes, reading without JavaScript, keyboard search, mobile navigation, copy controls, interactive companions, layout, and accessibility.

`handbook/manifest.json` lists every published route and source hash. `deployment-manifest.json` binds the static files to the deployment commit. Each chapter also links to its exact Markdown revision. New and updated chapters are deployed by the existing Pages workflow when their reviewed changes reach `main`.
