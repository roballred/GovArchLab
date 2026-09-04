# GovArchLab — Architecture Overview Artifact

A single self-contained HTML file for drafting, reviewing, and editing
a **layered architecture overview** in a browser. Open it in Chrome,
Edge, Safari, or Firefox (desktop), work in it, save. In Chrome and
Edge the changes are written back into the same `.html` file
in-place; Safari and Firefox download a fresh copy of the modified
file — same content, you replace the original manually. Round-trips
through email, SharePoint, or any other file transport without
needing a server.

## Try it

1. Download **[architecture-overview.html](architecture-overview.html)**.
2. Open it in Chrome, Edge, Safari, or Firefox (desktop).
3. Flip the top toggle from **View** to **Edit** and start typing.

That's the whole product. The tracked file ships **empty** — you'll
see the shell (title block, status roll-up, an empty diagram area with
a "no layers yet" hint, and a notes textarea at the bottom). Click
**+ Add** in the toolbar to create your first layer.

Example drawings with dummy data will land in this repo later, so you
can look at a realistic-looking sample without having to build one.

## What it looks like

- A **status roll-up** at the top counts every item by status bucket.
- A **stack of coloured layer bands** — each holds the items that
  belong to that layer. Bands collapse to a single row when you don't
  need to see inside.
- **Items inside each layer** render as compact tiles: name, short
  description, status badge. Click any tile for the full record —
  fields, comments, tags, per-item layout overrides.
- A **legend** and a free-form **Notes** textarea at the bottom.

Everything is inline-editable in Edit mode. Drag the grip strip on the
right edge of any item to reorder among siblings (or focus it and use
arrow keys — the drag works with the keyboard too).

See **[USER-GUIDE.md](USER-GUIDE.md)** for the full walkthrough:
modes, editing, saving, print, keyboard shortcuts, browser support,
SharePoint workflow.

## Repo layout

Deliberately minimal — this is one HTML file plus its documentation:

```
architecture-overview.html   the product (Vue inlined, tracked file ships empty)
USER-GUIDE.md                how to use it
README.md                    this file
LICENSE                      MIT
```

`architecture-overview.html` is self-contained. Vue 3 is embedded
inline; there is no CDN, no runtime dependency, no server. Anyone
running a modern desktop browser (Chrome, Edge, Safari, or Firefox)
can open it and use it. Chrome and Edge get save-in-place via the
File System Access API; Safari and Firefox get download-a-copy on
save (same data, manual file replacement).

## Keeping a private working file

The tracked `architecture-overview.html` ships empty. If you want to
work on your own drawing without pushing it, copy the tracked file to
a `-mine` name and start adding layers there:

```bash
cp architecture-overview.html architecture-overview-mine.html
open architecture-overview-mine.html   # macOS, or double-click in Finder
```

`.gitignore` excludes `*-mine.html`, so your private copy stays local.
The app's Save button writes back to the file you opened, so once you
switch to the `-mine` copy, saves land there.

## Making changes

The whole thing is one file. Open `architecture-overview.html` in a
text editor and edit the CSS, HTML template, or JavaScript directly.
Reload the file in a browser to verify. That's it — no build step, no
compile, no bundler.

**Structural map of the file** (the file is ~300 KB, but broken into
clear sections):

- `<style>` block near the top — all CSS.
- `<script type="application/json" id="schema">` — the level schema
  (what layers/items are called, their layout, fields).
- `<script type="application/json" id="seed-data">` — the drawing data
  (nodes, comments, title block, notes).
- `<script id="vendor-vue">` — pinned Vue 3.5.41 (~140 KB inlined).
  Don't hand-edit this block.
- `<div id="app">` template — the Vue root template (`NodeView` is
  recursive; every depth renders through the same component).
- `<script>` at the bottom — the app definition (data, computeds,
  methods, mounted lifecycle, custom tooltip IIFE).

**Quick sanity check** after any edit — before committing:

```bash
npm install   # first time only — installs jsdom as a devDependency
npm test
```

This runs `scripts/verify.mjs`, a small jsdom-based check (no test
framework, no build step) that: the `#schema` and `#seed-data` JSON
blocks parse, Vue actually mounts and renders (no raw `{{ mustaches }}`
left on the page), and the save-file serializer's regex replace still
finds its targets and round-trips a fixture that contains `</script>`
in a field. It's the mechanical version of the manual reload check,
and it's what CI runs on every push and PR (`.github/workflows/verify.yml`).

`npm test` doesn't replace opening the file in a browser — it catches
"the artifact is structurally broken" bugs, not visual or interaction
regressions. Still reload and click through the app after any change:

1. Reload the file in Chrome, Edge, Safari, or Firefox.
2. Confirm interactive controls still work (toggle View/Edit, expand a
   layer, open a detail modal).

`architecture-overview.html` itself has zero runtime dependencies —
`npm install` is only for the verification harness, never shipped to
users. The devDependency (`jsdom`) is not vendored into the artifact.

## Upgrading Vue

To move to a newer Vue: replace the `<script id="vendor-vue">…</script>`
block in the file with the new
[Vue global-build minified bundle](https://unpkg.com/vue@3/dist/vue.global.prod.js).
Reload and verify. The API surface Vue uses here (`createApp`,
`components`, `data`, `computed`, `methods`, `mounted`, `watch`)
hasn't shifted since Vue 3.0, so major-version stability is high.

## License

MIT — see [LICENSE](LICENSE).
