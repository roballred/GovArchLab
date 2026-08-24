# architecture-overview.html — Context for AI hand-off

This file is a briefing for another AI (or a developer) picking up this
project. It captures the design decisions, the working conventions, the
known-broken bits, and the traps that already caught me so they don't
catch you.

If you're the user reading this and want the how-to-use-it doc, read
[architecture-overview-documentation.md](./architecture-overview-documentation.md).

---

## What this product is

A **single-file HTML artifact** — no server, no build-time dependencies at
runtime, no CDN — that lets an architect draft, review, and edit a
layered architecture overview in a browser and save the changes back
into the same `.html` file. The intended deployment is a
SharePoint / Teams library that team members OneDrive-sync locally.

The whole product is **one deliverable**: `v2/architecture-overview.html`.
Anything else in the repo exists to produce or maintain that file.

## Level labels are user-configurable

Critical to understand before touching anything that displays a node type:

**The engine never hard-codes what to call things.** "Layer" and
"Capability" are just what THIS drawing's schema chose. In another use of
the same engine those levels might be Layer → Component, Layer → Service,
Domain → Value Stream → Capability, or anything else.

Every place the UI shows a node-type name, it comes from
`levels[depth].label` (or `.plural`) via `levelLabel(d)` — a method on the
Vue app that reads dynamically. Consumers include heading text ("Add
capability inside …"), toolbar buttons ("+ Add layer"), the child-count
line ("3 capabilities"), aria-labels, tooltips, and the Rename levels…
modal.

The **user can rename any level in-app** (Edit mode → Rename levels…).
That modal also lets them add depth, add fields, change layout and frame.
The rewrite lands in the schema block in the file on next save.

**When you write new UI text**, follow the same pattern: pull the label
from `levelLabel(depth)` or `childLvl.label`, never inline a string like
"capability" or "layer" in template markup. The instance schema is what
tells the engine what to call things.

**Per-parent child-type override.** A NodeView also carries two computed
labels — `childTypeSingular` and `childTypePlural` — that read
`node.childType` / `node.childTypePlural` and fall back to the schema
label when unset. The editable "N items" input in the `.ncount` slot
writes to those two props via `renameChildType`. That means two
sibling Layers can label their children differently ("Services" vs
"Components") without touching the schema. Any new template that names
a node's kids should read the computed, not `childLvl.label` directly;
otherwise the override silently doesn't apply and the rename looks broken.
`childType` and `childTypePlural` are in `RESERVED` alongside `id`,
`children`, `columns`, `collapsed`, etc. — if you add any similar
per-node system property, add its key to `RESERVED` in the same call so
it doesn't leak out of `fieldsOf()` as an "inferred" field and show up
as `Child Type Plural: Zones` at the bottom of every tile.

**Per-subtree schema (per top-level layer).** Each top-level node can
carry its own layout/frame/detail/label configuration via three optional
properties:
- `node.selfType` / `node.selfTypePlural` — the item's own type name,
  overriding the global `levels[0].label` / `plural` for THIS item.
- `node.childLevels[]` — array of partial level definitions for depths
  1..N inside this item's subtree. Each entry may override `label`,
  `plural`, `layout`, `frame`, `columns`, `detail`, `numberKey`.
  **Fields are NEVER per-subtree** — they stay on the global
  `levels[d].fields` so the status roll-up and legend keep aggregating
  consistently across the whole drawing.

The `app.levelFor(node, depth)` resolver merges the per-subtree overrides
on top of `app.levelAt(depth)`. NodeView's `lvl` and `childLvl` computeds
call `levelFor(this.topLevel || this.node, ...)`. The `topLevel` ancestor
is threaded down as a prop from the root iteration — cheaper than
walking back up on every render.

Per-subtree config now lives **inside the normal node edit modal** (the ✎
pencil action) — no separate button or modal. When `modal.depth === 0`,
the modal renders a `.lccard` section with the selfType / selfTypePlural
inputs and a v-for over `modal.data.childLevels` (or an empty-state hint
+ "+ Add depth override" if none). `saveNode`'s existing
`Object.assign(hit.node, modal.data)` writes the overrides straight back
onto the live node — no dedicated `openLayerConfig` / `saveLayerConfig`
methods needed. Non-top-level nodes never see the section (v-if guard).

`selfType`, `selfTypePlural`, and `childLevels` are in `RESERVED` — they
don't leak out of `fieldsOf()` as inferred fields on the tile.

**When you add a new per-node system property**, add its key to `RESERVED`
in the same commit and (if it changes rendering) plumb it through
`levelFor` and/or the NodeView computeds. Anything else means the value
sits in the JSON and does nothing.

**When you write docs** (either this one or the user guide): treat "Layer"
and "Capability" as *this drawing's* names for depth 0 and depth 1. Use
generic phrasing ("item", "child", "node at depth N") where the point is
about behavior, not this specific schema.

## Standing constraints from the user

Absorb these before touching anything.

1. **Single `.html` file** is non-negotiable. Vue, all JSON, the seed data,
   the schema, and all comments live inside it.
2. **Chrome/Edge desktop is the target.** File System Access API is required
   for save-in-place. Other browsers fall back to download (implemented,
   works, less pleasant).
3. **SharePoint deployment.** The file is opened from a synced local path,
   edited, saved back to the local file, and OneDrive syncs to SharePoint
   on its own timer. **This has not been end-to-end verified in a real
   SharePoint environment yet** — treat it as designed-to-work.
4. **WCAG 2.1 AA** is enforced by an in-tab audit script and by design.
   Text ≥ 4.5:1, non-text UI borders ≥ 3:1, visible focus, accessible
   names on every control.
5. **Light theme only.** Dark theme was removed (see "Retired features").
6. **Don't rebuild artifacts silently.** All the other artifacts have been
   archived — see "Repo layout." But the reflex of "don't touch other
   files without explicit sign-off" should carry over to any new work.
7. **`node migrate.js` overwrites the built .html with fresh seed data
   from `architecture_overview_template.html`.** Every layer, every
   item, every comment the user has saved into `v2/architecture-overview.html`
   through the Save button gets replaced. Before running migrate, either:
   (a) confirm the user's on-disk file matches the source template, or
   (b) patch the built file in place with surgical Edit calls to CSS /
   JS / template only, leaving the JSON seed blocks alone, or
   (c) get explicit sign-off that losing their live data is fine. I
   have burned the user's work **three times** on this now. The habit
   to build: after every engine edit, run `node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(...)"` to
   validate — DO NOT run `node migrate.js architecture-overview` unless
   the user has confirmed a seed reset is fine. The mount check exercises
   the same jsdom path without touching the JSON blocks.

## Repo layout

Two kinds of files: **the engine and its build tools** (shared, would
look the same in any project of this shape) and **the artifact's own
files** (the drawing being built here — its template, its deliverable,
its docs). Rename the artifact and you'd rename every file in the
second group.

```
/                                          top-level project
  ┈┈┈ engine + build tools ┈┈┈
  artifact-engine.html                     the shared engine (~275KB with Vue inlined)
                                           — HTML/CSS/JS + placeholder JSON blocks
  build.js                                 inlines vendored Vue → engine, then requires migrate
  migrate.js                               parses the artifact's template, emits the deliverable,
                                           calls mount-check
  mount-check.js                           headless jsdom guard; called after each emit
  package.json                             jsdom is a devDependency
  node_modules/                            populated by `npm install` (jsdom + its transitive deps)
  vendor/vue-<version>.global.prod.js      pinned Vue build, SHA-256 verified by build.js

  ┈┈┈ this artifact's files ┈┈┈
  architecture_overview_template.html      the seed drawing that migrate.js parses
                                           (rename per artifact)
  v2/
    architecture-overview.html             the deliverable (~280KB) — engine + this drawing's JSON
    architecture-overview-documentation.md the user guide for this drawing
    architecture-overview.md               this file — AI-context handoff for this drawing
```

A checkout may also contain historical files (earlier drawings, a
retired `archive/` directory, throwaway examples) that are neither
input to nor output of the current pipeline. If they exist, they don't
affect the build; the pipeline only reads what `migrate.js` explicitly
names. If you're not sure whether a file matters, grep `migrate.js`
and `build.js` for it — anything not referenced there is inert
history.

## Build pipeline

```bash
node build.js                           # full rebuild (currently one file)
node build.js architecture-overview     # same, with an explicit filter
```

`build.js` steps:
1. Reads `vendor/vue-3.5.41.global.prod.js`, verifies its SHA-256 hash
   (`45c5186437878319a4b86339f475e8e2f0b27e1752f9e6387ebb15854425847f`),
   refuses if `</script` is present in the vendor blob.
2. Inlines vendor Vue into `<script id="vendor-vue">…</script>` in
   `artifact-engine.html`.
3. Refuses to write if any `https://cdn.` or `https://unpkg.` reference
   survives (defense against accidental external deps).
4. Requires `./migrate.js`, which stamps the engine into `v2/*.html`.

`migrate.js` calls `emit()` once per artifact (just the overview now).
Each `emit()`:
1. Rewrites `<title>`, `<script id="schema">`, and `<script id="seed-data">`
   blocks inside the engine template.
2. Writes to `v2/<file>.html`.
3. Calls `mount-check.js` on the written file.

`mount-check.js` runs each written file through jsdom (via
`http://localhost/<basename>` — the file:// scheme trips jsdom's opaque
origin check for localStorage). Passes if:
- `document.getElementById('app')._vnode` is truthy (Vue mounted), AND
- `#app` has a `.wrap` element inside (Vue rendered its template).

Failures collect via `process.on('beforeExit')` and exit non-zero.

### Why the jsdom guard exists

Earlier in this project I shipped a broken file where I had markdown-style
backticks in an HTML comment INSIDE a JavaScript template literal:

```js
// this is inside template: ` ... `
// <!-- ... inner buttons `.stop` so their own actions still run. -->
```

The backticks around `.stop` closed the outer template literal at parse
time. JavaScript then read `.stop` as a property access on the string.
The resulting `TypeError: <template>.stop is not a function` was
completely silent — no build error, just a page that rendered raw
`{{ mustaches }}` in the browser. The user found it. jsdom mount catches
that exact bug now. **Always let the mount check run before saying a
change ships cleanly.**

## Development structure

Everything a running artifact needs at browser time is baked into the
one `.html` file — no HTTP calls, no `<script src>`, no external asset.
But at development time there's a small graph of files that produces
that one output, and understanding the graph is the difference between
a safe change and blowing away the user's data (which I have done
three times; see constraint #7).

### The two-file model — the most important thing on this page

```
                   ┌──────────────────────────┐
                   │   artifact-engine.html   │  the engine
                   │  (~275KB, Vue inlined)   │  UI, JS, CSS + placeholder JSON
                   └───────────┬──────────────┘
                               │
              node build.js    │    ← stamps schema + seed JSON in
                               ▼
┌───────────────────────────────────────────────┐
│  v2/architecture-overview.html                │  the deliverable
│  = engine + THIS SPECIFIC DRAWING's data     │  ~280KB, is what a user opens
└───────────────────────────────────────────────┘
```

- **`artifact-engine.html`** is a shared template — same code for every
  future artifact. It contains fully-working HTML/CSS/JS + the two
  placeholder JSON blocks (`<script id="schema">`, `<script id="seed-data">`)
  with empty defaults.
- **`v2/architecture-overview.html`** is the shipped file. It's the
  engine with the schema and seed JSON blocks REWRITTEN to hold this
  specific drawing's content (title, layers, items, comments, etc.).
- **The seed JSON in the built file is where the user's live work
  lives.** They edit through the browser UI, hit Save, and the file
  writes itself back to disk with fresh JSON.

**Every change you make must be applied to BOTH files**, or the next
rebuild reverts it. The safe way is documented under "Safe development
workflow" below.

### File roles

| File | Role at build time | Role at run time |
|---|---|---|
| `artifact-engine.html` | **Input** — shared engine template. All UI/JS/CSS edits go here first. | Not used — never opened directly. |
| `architecture_overview_template.html` | **Input** — the seed drawing (7 sample layers) that gets parsed into JSON by `migrate.js`. | Not used. |
| `vendor/vue-3.5.41.global.prod.js` | **Input** — pinned Vue library. `build.js` inlines this into the engine and SHA-verifies the file. | Not used (already inlined). |
| `build.js` | **Tool** — inlines Vue, then delegates to `migrate.js`. | Not used. |
| `migrate.js` | **Tool** — parses the template and emits `v2/architecture-overview.html` with fresh seed JSON. | Not used. |
| `mount-check.js` | **Tool** — headless jsdom test called by `migrate.js` after every write. | Not used. |
| `v2/architecture-overview.html` | **Output** — the deliverable. | The file the user opens in Chrome/Edge; carries the user's live drawing data in its seed JSON block. |
| `v2/architecture-overview-documentation.md` | Reference | Not used. |
| `v2/architecture-overview.md` | Reference (this file) | Not used. |

### External dependencies

The project has exactly **one runtime dependency** (Vue) and **one
development dependency** (jsdom). Both are pinned; neither is fetched
at runtime.

#### Vue 3.5.41 — vendored, not npm-installed

- **Location**: `vendor/vue-3.5.41.global.prod.js` — the global build,
  minified, ~160KB.
- **Why vendored, not fetched from a CDN**: the artifact must run
  offline and inside a SharePoint web view where CSPs may block CDNs.
  A vendored copy also means the file never breaks because a CDN URL
  changed.
- **How it's included**: `build.js` reads the file, verifies it against
  a SHA-256 hash constant (`EXPECTED_SHA256` at the top of `build.js`),
  refuses to proceed if the hash doesn't match, then splices the whole
  library into `artifact-engine.html` inside a
  `<script id="vendor-vue">…</script>` block. On rerun `build.js`
  replaces that block by id, so re-running never stacks copies.
- **Also refuses** to write out any file that still contains a
  `https://cdn.` or `https://unpkg.` reference — a paranoid double-check
  against re-introducing a CDN dependency.
- **How to upgrade Vue**:
  1. Download `vue-<new-version>.global.prod.js` from the Vue release
     tarball into `vendor/`.
  2. Compute its SHA-256 (`shasum -a 256 vendor/vue-<new>.global.prod.js`).
  3. Update `EXPECTED_SHA256` and the filename `path.join(DIR, 'vendor', ...)`
     in `build.js`.
  4. Run `node build.js` — SHA check enforces the version match.
  5. Run the mount check + a jsdom behavior test. Vue's global build
     is very stable, but breaking changes in template compilation can
     surface as silent render failures.

#### jsdom (~via npm) — build-time only

- **Location**: `node_modules/jsdom` after `npm install`. Listed in
  `package.json` as a `devDependency`.
- **Why**: the mount check needs a headless DOM environment that can
  execute Vue's inlined script, mount `#app`, and let us inspect the
  rendered output. jsdom is the standard tool for that.
- **How it's used**: `mount-check.js` (~70 lines) boots the built file
  under `http://localhost/<filename>` and asserts that
  `#app._vnode` exists AND `#app` contains a `.wrap` element. Any
  jsdom-side runtime error surfaces as a build failure.
- **Note on the URL**: we specifically boot under `http://localhost/`
  rather than `file://` because jsdom classifies `file://` as an
  opaque origin, which crashes `localStorage` access on mount. The
  artifact reads `localStorage` for the author's name on load, so
  `file://` would fail every build. See constraint documented in
  [mount-check.js](../mount-check.js:39).
- **`npm install`** is a one-time step for anyone working on the code.
  End users (opening the shipped `.html` in a browser) don't need
  node, npm, jsdom, or anything else — the deliverable is self-contained.

#### That's it

No React, no bundler, no Webpack/Vite/Rollup, no TypeScript, no
PostCSS. If a future change tempts you to add one, the answer is
almost certainly "no" — the single-file constraint and the offline
deployment are load-bearing.

### Safe development workflow

The tension: any change to the engine needs to reach the built file to
matter. But `migrate.js` rebuilds the built file **from scratch**,
which OVERWRITES the seed JSON that holds the user's live drawing
data. That's the trap I've fallen into three times.

There are two workflows, and picking the wrong one loses user work.

#### Workflow A — full rebuild (safe only when seed reset is fine)

Use when:
- You're on a fresh checkout with no user data yet
- The user has explicitly said "yes, reset the seed data to the
  sample template"
- You're testing engine changes with the sample data on purpose

Steps:
```bash
npm install                            # once per checkout
node build.js                          # inlines Vue + runs migrate + mount check
open v2/architecture-overview.html     # visual QA in Chrome/Edge
```

`build.js` writes the built file, its schema, its seed JSON — the
whole thing — from scratch every time. **User data in the built file
is destroyed.**

#### Workflow B — surgical patch (safe when user data exists) ← the default

Use when:
- The user has been editing the artifact and their seed JSON in
  `v2/architecture-overview.html` contains real work
- You need to ship an engine change (UI, JS, CSS) without touching
  the drawing content

Steps:
1. Edit `artifact-engine.html` as normal (the engine is the source of
   truth for the code).
2. Apply the **same textual edit** to
   `v2/architecture-overview.html` using precise `Edit` calls —
   never `Write` the whole file. The built file's JSON blocks stay
   untouched because you never target them.
3. Run the mount check **directly**, without going through
   `migrate.js`:
   ```bash
   node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓ mounts cleanly'), e => { console.error('✗', e.message); process.exit(1); })"
   ```
4. Optionally run a jsdom behavior test against
   `v2/architecture-overview.html` to prove the new behavior works.

The invariant: **every code-only change appears in both files, and
the built file's JSON blocks are never rewritten by a tool.**

#### Never do this
- `node build.js` on a checkout with live user data unless the user
  has confirmed a seed reset is fine.
- `node migrate.js architecture-overview` — same problem, different
  entry point.
- `Write` on `v2/architecture-overview.html` — it replaces the whole
  file including the seed JSON. Use `Edit` only.
- Edit only the built file. The next legitimate rebuild reverts your
  change. The engine is the source; the built file is a derivative
  you're forced to touch to keep the current session working.

### Running and previewing

- **The deliverable runs from disk as a `file://` URL in Chrome/Edge.**
  No server, no build step at the reader's end.
- **For a preview during dev**: open
  `v2/architecture-overview.html` directly in the browser. `file://`
  gives you full functionality including the File System Access API
  (Save updated file) and IndexedDB (persistent file handle across
  sessions).
- **jsdom (mount check + tests) intentionally boots the file under
  `http://localhost/<basename>`** — see the note under "jsdom" above.
  The URL doesn't have to resolve; jsdom never fetches from it.

## Runtime architecture

### Vue 3, globally-registered mount

The engine boots Vue via the global build (no ES modules). One component
is declared: `NodeView` (recursive, does the entire tree render). It uses
a JS string template — NOT a single-file component. The old `BlockList`
component (prose notes above/below the diagram) and its toolbar buttons
were removed; the always-visible `boardNotes` textarea at the bottom of
the page covers that need without the toolbar clutter.

### The PRISTINE pattern

Before Vue is called, the raw `<!DOCTYPE>` + `<html>` outerHTML is captured
into a constant `PRISTINE`. This snapshot preserves the template markup as
written, because Vue's mount compiles templates in-place and destroys the
DOM structure. `buildFile()` uses `PRISTINE` (with the two JSON blocks
rewritten) to serialize the file back to disk.

### The two JSON blocks

- `<script type="application/json" id="schema">` — the schema:
  presentation mode, levels, per-level field defs.
- `<script type="application/json" id="seed-data">` — the content:
  title, subtitle, boardNotes, titleBlock, titleBlockHelp, blocks,
  nodes, meta (docId + rev history).

These are the only source of truth for what the file shows. Reading and
rewriting them is how buildFile / saveFile / mount-check all work.

### Save-in-place with IndexedDB handle persistence

The File System Access API grants a write handle per-tab. Persisting the
handle across tab reloads was added via an IndexedDB store named
`artifact-handles`, keyed by the artifact's `docId` (from `meta.docId`).
Flow:

1. First save in a fresh tab → `showSaveFilePicker()` → user picks the
   file → `fileHandle` is stored in IndexedDB against `docId`.
2. Next tab load → `mounted()` calls `getStoredHandle(docId)` and
   populates `fileHandle` if the browser still has it.
3. Before writing → `ensurePermission(handle)` re-requests write permission
   (browsers require this after a reload — one-time click).
4. On overwrite → `diskRevision()` reads the file back, compares `meta.rev`
   vs. the in-memory rev, warns on conflict.

`fileHandle` lives at module scope in the app script — NOT reactive. Vue's
Proxy wrapping breaks the FileSystemFileHandle interface, so keeping it out
of reactive data was intentional.

### Data model

Everything on the drawing is a `node`:
```
{
  id: number,           // unique within the document
  children: [ ...node ], // recursive
  comments: [ { text, by, at } ],
  [primary field]: string,   // 'name' or 'title' depending on level
  [sub field]: string,       // 'desc' or 'blurb'
  [other fields]: ...,       // any schema-declared field
  accent?: '#rrggbb',   // per-node color override (top-level only in UI)
  bg?: '#rrggbb',       // LEGACY dark-theme value; ignored by light-only engine
  collapsed?: bool,     // undefined = collapsed (default), false = expanded
  dashed?: bool         // outside-the-boundary marker (from Zone Model era)
}
```

Depth beyond the deepest declared level reuses the last level's fields and
layout via `levelAt(d)`. That's how sub-capabilities work: nesting a node
under a capability creates a node at depth 2, which falls back to
Capability's schema.

### Schema

```
{
  strict: false,          // if true, only declared fields render
  summary: true,          // enable summary/detail split on tile levels
  presentation: 'sheet',  // 'sheet' or 'page'
  levels: [
    { label, plural, layout, columns, numberKey, frame, detail, fields: [...] }
  ]
}
```

- `layout`: `rows` | `grid` | `labeled` (colour block on left, kids on right).
  Grid is responsive: `NodeView.childStyle()` emits
  `repeat(auto-fit, minmax(260px, 1fr))` regardless of the level's
  `columns` value or the parent node's own `columns` override. Those
  values still round-trip through save but the CSS ignores them; kill
  the old per-count grid math and this is why. If you re-introduce a
  fixed column count, users with information-dense layers will see
  tile widths crash below readable at ~5 kids per row.
- `frame`: `outline` (default) | `accent-left` | `accent-top` | `accent-all` | `plain`
- `detail`: `full` (all fields inline) | `summary` (name + clamped sub;
  full record only in modal)
- `fields[i]`: `{ key, label, type, primary?, sub?, inline?, default?,
  options?[], help? }`
- `type`: `text` | `textarea` | `number` | `boolean` | `list` | `select` |
  `badge`

`primary` marks the field used as the node's display name. `sub` marks the
field shown as its description. `inline` renders as a small tag in the
header rather than a full field.

### Colour and contrast

The engine ships one palette (light theme). Layer accents come from a
per-layer `paint[]` array in `migrate.js` cycled by index; every new
top-level node created at runtime is stamped from the `PALETTE`
constant in `blankNode(depth)` on the same rule. There is no runtime
colour picker — that UI was removed because changing an accent on a
laid-out sheet was low value for the modal clutter it added. To force a
specific colour on a specific node, set `node.accent` / `node.bg`
directly in the file's seed data JSON.

Every colour choice on the drawing is run through one of these helpers so
WCAG 1.4.3/1.4.11 always holds:

- `readable(fg, bg, min)` — nudges `fg` darker until `contrast(fg, bg) ≥ min`.
- `solidPair(accent, min)` — returns `{ fg, bg }` where fg is the accent
  and bg is pushed until the pair clears `min`. Used for `labelPair` on
  layers because mid-tone accents (teal, olive) don't clear 4.5:1 against
  either pure white or pure black text.
- `onColor(bg)` — picks whichever of black / white gets a better ratio.
- `blend(fg, bg, alpha)` — composites a translucent colour over an opaque
  one. Used everywhere to flatten a semi-transparent tint before measuring
  its real contrast.

**The contrast-drift trap**: a previous bug had painting logic
(`paintBg`) and measuring logic (`solidBg`) as separate computeds that
had diverged. Now both derive from a single `paintsOwnFill` answer to
prevent that class of bug.

**The `!important` trap**: an early CSS rule had
`.sheet .kids>.node{border:1px solid var(--card-border) !important}`
which silently overrode the per-node `cardBorder` computed. Removed. The
per-node value is what respects the accent-adaptive contrast, not the
static token.

### Contrast auditing (in-browser)

A JS snippet in the scratchpad (see the mount-check pattern) can walk
every visible text node, measure its actual composited background,
compute contrast, and count failures. Historical runs:
- Before this session: 100+ failures (mixed contrast and border issues).
- End of this session: 0 text failures, 0 border failures across
  view/edit × collapsed/expanded × all-status-values × modal-open.

## UI patterns

### Custom tooltip system

Every element with a `title` attribute gets a styled bubble on hover
(after 250ms) or keyboard focus (immediate). Implementation is
event-delegated on `document`; the title is stripped while the custom
tooltip is showing and restored on mouseleave/blur/click/scroll. This is
100% CSS-plus-a-single-IIFE, no template edits, no per-element wiring.

If you add a new control with a `title="..."` attribute, it automatically
gets a tooltip. No further work needed.

### Inline editing everywhere

`hd-in` (title/subtitle), `nsub-in` (layer descriptions), `tb-in` (title
block fields). Common CSS pattern:
- transparent background
- font/color: inherit (looks like the surrounding text)
- dotted underline as the "you can type here" affordance
- borderless

Toggles between an `<input>` / `<textarea>` and a static template with
`v-if="mode==='edit'"`. Watchers on the relevant reactive fields flip
`dirty` to true when any change lands.

### Click-anywhere-to-expand

When a container is collapsed, clicking the whole label cell (or nodehead)
toggles expand. Inner buttons (`.discloser`, `.nname`, `.nctrls .ic`,
inputs) all use `@click.stop` to prevent double-firing.

Rule of thumb: **if you're adding a clickable thing inside a collapsable
node's header, add `@click.stop` on it.**

### Collapse persistence

`node.collapsed` is a real field on the node, saved with the document.
Undefined = collapsed (default state for a fresh document — top-level
overview only). Explicit `false` = expanded. Written by the caret and
the labelcell click handler; auto-set to `false` on the parent when a
new child is added into a collapsed container (so the new node doesn't
vanish behind a closed row).

### Detail modal (native `<dialog>`)

Focus trap, Escape closes, backdrop dim, page rendered inert. Vue drives
`open`/`close` from a watcher on `modal` state so keyboard escape and the
close button end up in the same place.

Adding a new node opens the same modal with `isNew: true`. Heading changes
to `"Add <level> inside <parentName>"` when parent is set — this was
important because just "Add capability" looked identical to "Edit
capability" from a distance and the user pushed back on that.

## Testing methodology

Two loops, in order — and the order matters, because a broken mount
makes every behavior test spuriously fail with the same "no vm" error.

### Loop 1 — mount check

The gate. If this fails, the file won't work in a browser.

```bash
# The safe way — direct call, doesn't touch seed data:
node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓ mounts cleanly'), e => { console.error('✗', e.message); process.exit(1); })"
```

The unsafe way (`node build.js`) also runs the mount check, but it
first rewrites the built file's seed JSON — losing user data.

**Never claim a change ships without a mount check passing.**

### Loop 2 — jsdom behavior test in scratchpad

Boot the built file in jsdom, drive Vue's reactive state directly,
invoke methods and click handlers, assert state and DOM.

The vm handle used to be reachable via
`document.getElementById('app')._vnode.component.proxy` but Vue's
compiled bundle now exposes it under `document.getElementById('app').__vue_app__._instance.proxy`
— either can go stale across Vue versions, so if the vm lookup returns
null, feel free to fall back to reading and dispatching against the
DOM directly.

Skeleton:
```js
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('/absolute/path/to/repo/node_modules/jsdom');

const html = fs.readFileSync('/absolute/path/to/v2/architecture-overview.html', 'utf8');
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.error('jsdomError:', (e.detail && e.detail.stack) || e.message));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://localhost/architecture-overview.html', // NOT file:// — see mount-check note
});

// jsdom lacks <dialog>.showModal / .close — polyfill so modal-open code doesn't crash.
if (dom.window.HTMLDialogElement) {
  dom.window.HTMLDialogElement.prototype.showModal = function(){ this.open = true; };
  dom.window.HTMLDialogElement.prototype.close     = function(){ this.open = false; };
}

setTimeout(() => {
  const doc = dom.window.document;
  // Interact with buttons via .click() / dispatchEvent.
  // Assert with querySelectorAll / textContent / etc.
  // The vm handle isn't required — driving the DOM is more resilient.
  const editBtn = Array.from(doc.querySelectorAll('button'))
                       .find(b => b.textContent.trim() === 'Edit');
  editBtn && editBtn.click();
  setTimeout(() => {
    // ... assert ...
    process.exit(0);
  }, 60);
}, 400);
```

The 400ms initial delay is enough for Vue to mount + initial reactive
setup. Each subsequent user-interaction step needs a short (~30-60ms)
`setTimeout` after it to let Vue flush its reactive updates before the
next assertion.

### Where to put behavior tests

The scratchpad directory (see the environment section of the runtime
prompt). These aren't committed — they're throwaway per-change proof
that the fix works. If a behavior is worth pinning permanently, add it
to `mount-check.js` instead so it runs on every build.

### What tests catch that mount-check doesn't

- **Event propagation contracts** — every `@click.stop` on a header
  button. The mount check just proves the DOM renders; only a
  behavior test catches "clicking the pencil ALSO expands the layer"
  and similar propagation regressions.
- **State that only matters after interaction** — collapse persistence
  after toggle, per-node overrides after inline edit, form values in a
  modal after `openNode`.
- **Race conditions in reactive updates** — passing a `.click()` and
  measuring DOM before Vue's next tick catches "the button did fire
  but the render didn't repaint" bugs.

### What tests don't catch

- **Actual browser features**: File System Access API, real IndexedDB
  persistence, real touch/mouse events, real focus rings, real print
  output. jsdom is a partial DOM, not a browser.
- **Contrast ratios in the rendered page**. There's an in-tab audit
  script for that; run it manually in Chrome DevTools when you touch
  colours or layout.
- **Visual regressions**. Look at the page in Chrome.

## Design decisions with context

### Why Vue instead of a leaner framework

Considered removing Vue when we killed the CDN. Reason to keep: the
recursive `NodeView` component with dynamic depth-driven layout is well-
served by Vue's reactivity, template syntax, and single-file component
model. Rewriting in vanilla JS would trade ~160KB of inlined Vue for
substantially more per-render manual DOM code and would put the entire
schema-driven rendering under manual state management. Not worth it.

### Why light theme only

The user tried dark theme and picked light. Removing the dark palette
also let me collapse the theme system entirely: no OS preference
listener, no localStorage keys, no data-theme attribute, no theme-picker
UI, no per-node dark bg values in painting logic. About 90 lines of code
gone and one class of contrast-drift bug (light-branch vs dark-branch)
eliminated.

### Colour picker: removed, then restored differently

**History.** Started life visible on every depth. On a Layer the accent
drove the whole coloured labelBg — visible effect. On any deeper node
(`frame: 'outline'`) the accent only nudged the name text colour, and
even that got bounded through `readable()` so mid-tones snapped to
almost-identical shades — the picker looked broken. First fix: hide it
below depth 0. Second fix: the user said changing Layer colours from
the modal was also low value for the space it took, so it was removed
entirely — accents auto-assigned from `PALETTE` at creation, override
via seed JSON only.

**Current state.** Both back, split into two purpose-clear pickers:

- **Layer colour** — top-level items only. Same PALETTE-based swatch
  row as the original; writes `node.accent` / `node.bg`. The auto
  assignment at creation still happens; this just lets the user
  override the default per layer.
- **Highlight** — non-top-level items only. A separate small palette
  (amber / red / blue / green / purple) of pale tinted **backgrounds**
  (not accent overrides). Writes a colour key to `node.highlight`.
  Read by `NodeView.hl` computed, applied by `paintBg` and
  `frameStyle`. `HIGHLIGHTS[key]` returns `{ label, bg, border }` — bg
  is the pale tint that fills the tile background, border is the
  darker sibling that outlines it. The two-tone pair is what makes the
  highlight readable at glance across the whole grid; using just a bg
  tint was tested and disappears against certain layer body tints.
  Highlight overrides the schema-level frame so a highlighted tile
  always shows its own colour ring regardless of the level's frame
  style.

Both swatch rows live in the detail modal (openNode). No dedicated save
paths — modal.data.accent / .bg / .highlight round-trip through
saveNode's `Object.assign(hit.node, d)` like every other field.

### Why the `title` attribute-based tooltip (not aria-describedby popovers)

Zero template edits. Every button and input already had `title="..."`
for native browser tooltips; the custom system reads from that. Screen
readers still get `aria-label` on icon-only buttons. `aria-describedby`
would have been more "correct" but would have required adding hidden
description elements and IDs everywhere.

### Why services were removed

The source template hard-coded a services list per capability. The user
wanted this generic — sub-capabilities are the real answer to "what's
inside this capability." Removing the services field freed Capability's
schema to just be name/desc/status, and the `+` button on a capability
now creates a proper sub-capability instead of adding to a services array.

## Retired features and why

| Feature | Why removed |
|---|---|
| Dark theme + theme picker | User picked light-only; removal simplified the code substantially |
| Colour stripe on summary tiles | User said the visual value wasn't worth the code |
| Services field on capabilities | Hard-coded values from source template; sub-capabilities are the flexible answer |
| Colour picker on non-top-level nodes | Had no visible effect; first hidden, then removed entirely. Restored in a different form later: non-top-level nodes now have a per-item **highlight** swatch (a small palette of tinted backgrounds — amber, red, blue, green, purple, plus a "no highlight" clear) that paints the tile so it stands out from its siblings. Writes to `node.highlight`; picked up by `NodeView.hl` computed and read by `paintBg` / `frameStyle`. |
| Colour picker on top-level nodes | Removed once, then restored per user request. Layers now have a `Layer colour` swatch row in the detail modal that writes `node.accent` / `node.bg` from the `PALETTE` constant. The original auto-assignment on layer creation still happens; the picker only lets the user override the default. |
| The four other artifacts (zone-model, zone-principles, hhs-principles, zone-board) | Consolidated into architecture-overview as the single deliverable; archived, not deleted |
| container-nesting-example.html | Throwaway demo; served its purpose |
| The `jsArray()` helper in migrate.js | Only used by zoneBoard, deleted with it |
| The `STATUS` constant in migrate.js | Only used by principles, deleted with it |
| `+ Note above` / `+ Note below` buttons + `BlockList` component + `addBlock`/`removeBlock` methods + `.blockbox`/`.blockedit` CSS | Redundant with the always-visible `boardNotes` textarea at the bottom; toolbar was getting cluttered. Existing `blocks` arrays in saved files still round-trip through the seed data (unrendered) so nothing breaks. |
| `Export text` toolbar button + `exportText` method | Nobody was using it; the same info lives in the seed-data JSON block inside the saved .html for anyone who needs a machine-readable dump. |
| ▲ / ▼ per-node reorder buttons | Replaced by the grip-strip on the right edge of each tile/layer; drag or keyboard-arrow to reorder among siblings. |
| Edit-mode tip banner + `Show tips` toolbar button + `expandHint` state + `.hint` CSS | Tip text went stale faster than it was worth maintaining — every time a control changed (▲▼ → grip strip, capability → item, etc.) the banner said something wrong for a session or two. The user guide covers the same ground and is easier to keep in sync. |

## Open items / not yet verified

- **Real SharePoint round-trip.** The whole save-back-through-sync flow is
  designed correctly but has not been driven end-to-end on a real
  SharePoint library. High-priority validation.
- **Real print output.** Landscape @page, background-preserved elements,
  break-avoidance are all set, but no printer or PDF-print has been done.
  Medium-priority. Print is the deck deliverable.
- **Firefox / Safari behavior at scale.** They download instead of
  save-in-place; verified in isolation, not real-world used.
- **Long capability lists.** Layouts tested up to ~5 capabilities per
  layer. Larger layers may need pagination or tighter tile spacing.
- **Multi-editor collab.** `meta.rev` conflict guard exists, but no
  real-world testing with two colleagues editing.

## Working conventions

- **Verify before shipping.** The user pushed back on premature "done"
  claims multiple times. Now: build → mount-check → jsdom behavior test →
  contrast audit → tell the user. In that order.
- **Ask about scope changes.** The user is scope-sensitive. If a change
  could affect anything the user didn't ask about, ask first.
- **Be honest about what's not verified.** SharePoint, print, real
  browser behavior — say when you haven't tested it, don't dress up
  design-should-work as verified.
- **Push back on the user.** They asked for a color stripe, then agreed
  to remove it. That kind of "let's try and see" back-and-forth is
  welcome. Don't just implement anything asked without weighing tradeoffs.
- **Concise and direct.** The user doesn't want marketing prose,
  they want the technical answer with the constraints and the decision.
  Present recommendations as decisions with a rationale, not "I could do
  X or Y or Z" without a lean.

## If you're picking this up cold

1. Read [architecture-overview-documentation.md](./architecture-overview-documentation.md)
   to know what the deliverable does.
2. Read the "Development structure" section above — especially the
   **Two-file model** and **Safe development workflow** subsections.
   Those two are the difference between shipping a fix and deleting
   the user's work.
3. Get the code:
   ```bash
   git clone https://github.com/roballred/GovArchLab
   cd GovArchLab
   ```
4. `npm install` — pulls jsdom for the build-time mount check.
5. **Check first**: does `v2/architecture-overview.html` contain user
   data (a drawing they've edited and saved)? Diff the seed JSON
   against `architecture_overview_template.html`. If unsure, ask.
6. If the built file matches the sample template → `node build.js` is
   safe. If the built file has real work in it → use Workflow B
   (surgical patch + direct mount-check), NEVER `node build.js`.
7. Open `v2/architecture-overview.html` in Chrome/Edge from your
   filesystem (`file://…`) and play with it in View and Edit mode
   before touching anything.

## First-time changes

Before editing the engine:
1. Grep for the feature you're changing across `artifact-engine.html`.
2. Read the relevant computed/method WITH its comments. The comments
   explain **why**, not just what — most were written after fixing a
   specific bug.
3. Edit `artifact-engine.html` (the source).
4. Mirror the same textual edit to `v2/architecture-overview.html` via
   precise `Edit` calls — Workflow B in the section above. **Do not
   run `build.js` or `migrate.js`** unless the user's built file
   contains no live data.
5. Run the mount check directly on the built file:
   ```bash
   node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓ mounts cleanly'), e => { console.error('✗', e.message); process.exit(1); })"
   ```
6. Write a jsdom behavior test in scratchpad to prove the new behavior
   AND to prove it hasn't broken adjacent behavior (the `@click.stop`
   propagation contract is a repeated stumbling block).
7. If the change touches contrast or layout, run the in-tab contrast
   audit for good measure.
8. Tell the user what you did, honestly. Include what you didn't test
   and whether the built file's seed data was touched.

## Common pitfalls (in order of frequency)

1. **Backticks in HTML comments inside template literals.** Never write
   `` `foo` `` inside a JS template literal string. Use `'foo'` or plain
   text. The mount check catches this at build time now, but don't rely on
   the guard — write the code right.
2. **Adding a clickable inside a collapsable node's header without
   `@click.stop`.** Will double-fire (both the inner action and the
   labelcell's expand handler). Every button-inside-header must stop
   propagation.
3. **Painting vs. measuring drift.** If you introduce a new colour or a
   new background computation, make sure the contrast measurement uses
   the same computed value as the paint call. Collapse them into one
   computed if you can.
4. **Vue reactivity + FileSystemFileHandle.** Don't put file handles in
   Vue's `data()`. Module-scope only. Vue's Proxy breaks the handle's
   interface.
5. **`localStorage` on `file://` under jsdom.** jsdom flags `file://` as
   an opaque origin. The mount check uses `http://localhost/…` for that
   reason; if you need to test in jsdom, use that URL scheme.
6. **Changing the schema JSON without regenerating buildFile output.**
   The schema block is embedded in the file; migrate.js is where its
   real source lives. Editing the artifact's embedded schema in the
   browser doesn't survive a rebuild.

## Files worth reading before working on this

- `artifact-engine.html`, top section: constants, patterns, helpers.
- `artifact-engine.html`, `NodeView` component: the entire recursive
  render tree lives here.
- `artifact-engine.html`, `saveFile()` and `diskRevision()`: the
  save-in-place flow.
- `migrate.js`: the one `emit('architecture-overview.html', …)` call.
- `mount-check.js`: the whole guard is ~70 lines.

## Handoff notes

There is no separate channel — you work through the AI conversation with
whoever is the current user of this artifact. Their identity is whatever
they've typed into the "Set your name" control in the toolbar, stored
in their browser's localStorage under `AUTHOR_KEY` and used only to
attribute comments. It's never written to the file.
