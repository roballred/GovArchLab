# GovArchLab — Architecture Overview Artifact

A single-file HTML artifact for drafting, reviewing, and editing a
**layered architecture overview** entirely in a browser. Open it in
Chrome or Edge, work in it, save — the changes are written back into
the same `.html` file, so it round-trips through email, SharePoint, or
any other file transport without needing a server.

The whole thing is one deliverable: [`v2/architecture-overview.html`](v2/architecture-overview.html).

## What it looks like

- A **status roll-up** at the top counts every item by status bucket.
- A **stack of coloured layer bands** — each is a container for items
  that belong to that layer. Bands collapse to a single row when you
  don't need to see inside.
- **Items inside each layer** render as compact tiles: name, short
  description, status badge. Click any tile for the full record
  (fields, comments, tags, per-item layout overrides).
- A **legend** and a **Notes** textarea at the bottom.

Everything is inline-editable in Edit mode: title, subtitle, layer
descriptions, item names, item descriptions, tags, ad-hoc fields. Drag
the grip strip on the right edge of any item to reorder among siblings
(or focus it and press arrow keys — the drag works with the keyboard
too, for accessibility).

## Building

```bash
npm install                       # pulls jsdom (one dev dependency)
node build.js                     # inlines Vue into the engine, then
                                  # stamps v2/architecture-overview.html
```

`node build.js` runs three steps:
1. Inlines the vendored Vue build (SHA-256 verified) into
   `artifact-engine.html`.
2. Parses `architecture_overview_template.html` and emits fresh seed
   JSON into `v2/architecture-overview.html`.
3. Boots the emitted file in a headless jsdom to prove Vue actually
   mounts — a template-compile error or JSON syntax error exits
   non-zero here, so a broken artifact never ships.

**A rebuild replaces the seed data.** If you've been editing
`v2/architecture-overview.html` in a browser and saving, those edits
live inside the file. `node build.js` will overwrite them with the
seed from `architecture_overview_template.html`. Commit or copy first
if you want to keep your live drawing.

## Repo layout

Two kinds of files: the **engine + build tools** (shared, would look
the same in any project of this shape) and the **artifact's own files**
(the drawing being built — its template, its deliverable, its docs).

```
/                                          top-level project
  ┈┈┈ engine + build tools ┈┈┈
  artifact-engine.html                     shared engine (~290KB with Vue inlined)
  build.js                                 inlines Vue, then runs migrate
  migrate.js                               parses template → emits deliverable
  mount-check.js                           headless jsdom guard
  package.json                             jsdom is a devDependency
  vendor/vue-<version>.global.prod.js      pinned, SHA-256 verified

  ┈┈┈ this artifact's files ┈┈┈
  architecture_overview_template.html      seed drawing
  v2/
    architecture-overview.html             THE deliverable
    architecture-overview-documentation.md user guide
    architecture-overview.md               AI-context handoff
```

## Keeping a private working file

The tracked `v2/architecture-overview.html` always carries generic
sample data (7 example layers, no real content). If you want to keep
an in-progress drawing on disk without pushing it, copy the tracked
file and give the copy a **`-mine`** suffix:

```bash
cp v2/architecture-overview.html v2/architecture-overview-mine.html
open v2/architecture-overview-mine.html    # macOS, or double-click in Finder
```

`.gitignore` excludes `v2/*-mine.html`, so your private copy stays
local. Save through the app's own Save button — it writes back to the
file you opened, not to the tracked one. When engine changes land in
the tracked file, apply the same edits to your `-mine` copy (or start
a fresh `-mine` from the new tracked build).

## Where to read next

- **[User guide](v2/architecture-overview-documentation.md)** — how
  to use the deliverable: modes, editing, saving, print, keyboard.
- **[AI-context handoff](v2/architecture-overview.md)** — how the
  engine is built, why decisions were made, how to safely extend it.

## AI-assisted development

GovArchLab uses the same AI methodology as its sibling repos
([GovEA](https://github.com/roballred/GovEA),
[GovCore](https://github.com/roballred/GovCore)) — humans lead, AI
amplifies, every change traces back to a persona and capability from
the [EasyEA framework](https://github.com/roballred/EasyEA). Four
documents govern that work; read them before contributing (as a human
or as an AI agent):

- **[Standards.md](Standards.md)** — the governing document. EasyEA
  framing, persona validation rules, traceability convention,
  issue-first development, and the "humans merge PRs" rule.
- **[CLAUDE.md](CLAUDE.md)** — Claude-specific project instructions.
  The two-file model, pre-flight checklist, and per-commit / per-PR
  traceability format.
- **[AGENTS.md](AGENTS.md)** — the same shape for OpenAI Codex.
- **[docs/AI-SESSION-START.md](docs/AI-SESSION-START.md)** — canonical
  session bootstrap. A new AI session reads this first; it points at
  every other source of truth.

## Contributing

- Follow the existing patterns before adding new ones.
- Every engine change must clear the mount check
  (`node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓'))"`).
- Never hand-edit the Vue-inlined block in `artifact-engine.html` —
  rerun `node build.js` if the vendor blob needs refreshing.
- Read the "Working conventions" section in the AI-context doc before
  making changes to how the engine loads, saves, or renders.

## License

MIT — see [LICENSE](LICENSE).
