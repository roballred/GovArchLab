# GovArchLab — Architecture Overview Artifact

A single self-contained HTML file for drafting, reviewing, and editing
a **layered architecture overview** in a browser. Open it in Chrome or
Edge, work in it, save — the changes are written back into the same
`.html` file. Round-trips through email, SharePoint, or any other file
transport without needing a server.

## Try it

1. Download **[architecture-overview.html](architecture-overview.html)**.
2. Open it in Chrome or Edge.
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
architecture-overview.html   the product (Vue inlined, sample data included)
USER-GUIDE.md                how to use it
README.md                    this file
LICENSE                      MIT
```

`architecture-overview.html` is self-contained. Vue 3 is embedded
inline; there is no CDN, no runtime dependency, no server. Anyone
running Chrome or Edge can open it and use it.

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

1. Reload the file in Chrome/Edge.
2. Confirm you don't see raw `{{ mustaches }}` on the page (Vue would
   have replaced them). If you do, the template didn't compile — check
   the browser console for the parse error.
3. Confirm interactive controls still work (toggle View/Edit, expand a
   layer, open a detail modal).

## Upgrading Vue

To move to a newer Vue: replace the `<script id="vendor-vue">…</script>`
block in the file with the new
[Vue global-build minified bundle](https://unpkg.com/vue@3/dist/vue.global.prod.js).
Reload and verify. The API surface Vue uses here (`createApp`,
`components`, `data`, `computed`, `methods`, `mounted`, `watch`)
hasn't shifted since Vue 3.0, so major-version stability is high.

## License

MIT — see [LICENSE](LICENSE).
