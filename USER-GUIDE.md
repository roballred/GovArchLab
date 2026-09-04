# Architecture Overview — User Guide

A single-file HTML artifact you open in a browser to draft, review, and edit
a layered architecture overview. Everything about the drawing — its content,
the schema behind it, and its revision history — lives inside the `.html`
file itself. Save writes the changes back into the same file.

---

## What you're looking at

Open **`architecture-overview.html`** in Chrome, Edge, Safari, or
Firefox (desktop). The page renders as a bounded engineering-style
drawing:

- A **title block** at the top left with the project name and subtitle.
  Underneath, four identifying fields (Project / Solution, Version,
  Date, Owner) show as a compact `KEY value · KEY value` chip row —
  in both View and Edit mode by default, so entering Edit mode doesn't
  immediately push the diagram down. In Edit mode, the chip row is a
  clickable button (a ▸ chevron marks it as expandable): click it to
  open the full labelled form with an input for each field. Click the
  **▾ Collapse** button above the form to fold it back to chips.
  Printing always shows the labelled form so a printout carries the
  identifying metadata, no matter which mode you printed from.
- A **status roll-up bar** — how many items are in each status bucket
  (Not assessed, Current, In progress, Planned, Gap).
- A **stack of coloured layer bands**, each holding the items that belong
  to that layer.
- A **legend** at the bottom listing every status value the drawing uses.
- A **Notes & comments** box below the legend — a single free-form
  textarea for context, open questions, or decisions that don't belong
  inside any specific item. Visible in both View and Edit modes; editable
  only in Edit. Drag the corner to resize it taller as needed.

No other UI is on the page by default — no chrome you don't need.

## Terminology — it's your call

The drawing uses two levels by default:

| Depth | Default label in this drawing | Renders as |
|---|---|---|
| 0 (top) | **Layer** | Coloured band across the sheet |
| 1 | **Capability** | Tile inside a layer |

**These labels are just this schema's choices.** A depth-1 node isn't
inherently a "capability" — the engine draws whatever's there and reads
its display label from the schema. In your own drawing they might be:

- **Component**
- **Service**
- **Value Stream**
- **Domain**
- **Business Function**
- Anything else you'd call the things inside a layer

There is no in-app **Rename levels…** button. For the common case — calling
one layer's children Services, adding a depth, changing layout — use the
**Subtree layout & depth** section of that top-level item's detail modal
(Edit mode). To change the drawing-wide defaults (rename Layer/Capability
for every node, add a field such as `status` on layers, add a third depth
for the whole file), edit the `<script type="application/json" id="schema">`
block in a text editor, Save, and reload.

Removing a field from the schema does **not** strip that field's values
from existing nodes — they just stop rendering. Safe to shrink. Adding
a field shows it on new and existing nodes at that depth once you reload.
Levels beyond the deepest declared one reuse the last level's schema, so
nested nodes render fine even without a new schema entry.

Throughout this guide, **"layer"** means whatever your depth-0 nodes are
called, and **"capability"** (or the generic **"item"**) means the
depth-1 nodes. When a specific instance name matters, it's noted.

## Two modes: View and Edit

The **View / Edit** toggle at the top switches the whole page between:

- **View** — read-only. What a reviewer or stakeholder should see. All
  input fields hide, description text is static, and only the collapse
  carets remain interactive. Expanding or collapsing a band in View is
  session-only — it does not mark the document dirty, does not trigger a
  "leave the page?" prompt, and does not persist into the file. Reload
  in View and the file's saved collapsed states come back.
- **Edit** — every field on the page becomes editable in place, action
  icons appear on every node, and the toolbar shows Add, Save, and other
  controls. Expanding or collapsing in Edit writes to the file — the
  layers you leave open are the layers everyone sees when the file is
  next opened.

Switching modes doesn't change or discard anything.

## Reading the drawing

- **Layer bands are collapsible.** Click anywhere on a collapsed layer band
  (or press its caret) to expand it and see its items. Click the caret
  again to hide them. The layout defaults to all-collapsed so the full
  overview fits on one screen.
- **Click an item's name** to open its detail view. That's the full record
  for that node, including its description, status, comments, and any
  custom fields.
- **Hover any control** for a help tooltip — appears after ~¼ second, or
  immediately when you Tab to a control with the keyboard.

## Editing inline

In Edit mode you can type directly over anything on the drawing:

- **Title** and **subtitle** at the top.
- Every value in the **title block** (Project / Version / Date / Owner).
  In Edit mode, the chip row stays compact until you click it — the
  ▸ chevron marks it as expandable. Once open, click into any field
  to type; format hints appear underneath each input. **The Date field
  auto-fills to today's date** the first time you focus it while it's
  empty — type over the value to change it, or leave it as-is. Click
  the ▾ Collapse button above the form to fold it back to chips.
- Every **layer name** and its **description** — click, type, done.
- Every **item name** and **description** — via the detail modal.

Nothing needs to be saved between typing and clicking away — the change is
held in memory as soon as you type, and the **● unsaved changes** pill
appears in the toolbar to remind you to Save the file.

## Adding, moving, and removing

Edit mode shows an action strip on every node:

| Control | Action |
|---|---|
| **Vertical grip strip** on the right edge | **Reorder** — drag it to a new position among siblings, OR focus with Tab and press ↑ / ↓ / Home / End |
| ✎ | Open the full detail form |
| **+** | Add a new child under this node |
| **×** | Remove this node (and its children) |

**Reorder details.** The grip is a **vertical strip on the right edge**
of each layer band and each item tile in Edit mode — click and drag
anywhere along the strip to move the item, or focus it with Tab for
keyboard reorder. A coloured bar appears above or below a sibling to
show where the drop will land. Or focus the grip and press:
- **↑ / ←** — move up one position
- **↓ / →** — move down one position
- **Home** — move to the first position
- **End** — move to the last position

Reordering only works among siblings — dragging one item onto a
different Layer won't move it there. Use the **Parent** dropdown in
the detail modal for cross-parent moves. Screen readers hear the new
position announced after each move.

The **+ button on any item** adds a **child under it**. Because levels
beyond the deepest schema entry inherit that level's rendering, adding a
child of a depth-1 item creates a depth-2 sub-item that looks like its
parent (unless you added a third schema depth to give it its own style).

The Add modal opens with the parent pre-selected in the Parent dropdown
and the heading reads simply **"Add item"** — the same label at every
depth, so the labels don't go stale when you rename levels. Once the
form's open, the Parent field tells you where it lands.

**+ Add** in the toolbar adds a new top-level node.

Deletes have no undo. The document's `meta.history` keeps the last 20
revision stamps (who saved rev N, when), but not their content — use
SharePoint version history for real rollback.

## The detail modal

Clicking a node name in View mode opens a read-only detail form. Clicking
in Edit mode opens the same form editable, with a Save button.

The modal shows:
- Every schema field for that node
- A **Parent** dropdown to move the node under a different parent
- A **Layer colour** swatch row (top-level layers only) — pick from the
  fixed palette to override the auto-assigned band colour.
- A **Highlight** swatch row (items inside a layer) — pick a tint colour
  to make this item visually stand out from its siblings. The tile paints
  with a pale-tinted background and a matching border. The leftmost
  "clear" swatch drops the highlight.
- A **Tags** row — loose text labels attached to this node. Type a tag
  and press Enter (or click **Add**); each tag chip has its own **✕** to
  remove it. Tags aren't declared in the schema — every node can carry
  any strings you want, and no two nodes need share a vocabulary.
  Duplicates on the same node are silently rejected. Tag chips are
  rendered as small hollow pills on the tile in both View and Edit
  modes, so a reader sees them without having to open the record.
- An **Add a field** input for adding a custom field on the fly. Ad-hoc
  fields (the ones tagged "inferred" in orange next to the label) can
  be removed with the small **✕** to the right of the label — the
  deletion is staged in the modal and applied when you Save; Cancel
  discards it. Schema-declared fields (name, description, status) have
  no delete button here; those are the drawing's shape and should be
  changed via the schema JSON, not per-node.
- The **comments thread**. In Edit, an add-a-comment input and a **✕**
  on each comment. In View, the thread is read-only — no add row, no
  ✕ — so a reviewer reading through the drawing can't accidentally
  delete someone else's comment or add one that would silently ride
  into the file on the next Save.

### Comments and attribution

Every comment is stamped with your name and the date. Your name lives in
`localStorage` only — never in the file — so multiple people opening the
same file each see their own name. Click **You: \<name>** in the toolbar
(or "Set your name") to change it.

Comments save immediately when you add them, whether you click Save on the
modal or Cancel. Cancel discards field edits, not comments.

### Status field

Each item carries a status (this schema declares it on the depth-1 level;
you can add the same field to other levels by editing the schema JSON — see
Terminology above):

| Status | Meaning |
|---|---|
| **Not assessed** (grey) | Nobody's decided what this is yet — the honest default |
| **Current** (green) | In place and working today |
| **In progress** (amber) | Being built / rolled out now |
| **Planned** (blue) | Committed but not yet started |
| **Gap** (red) | Known to be missing or inadequate |

The status roll-up bar under the title block counts each value across all
items so you can see progress at a glance. Only statuses that appear on
at least one item show in the legend.

## Configure a top-level item's subtree

The **edit modal** (the ✎ pencil on any top-level layer/item) carries a
**"Subtree layout & depth"** section directly inside the same form as the
regular fields. No separate button, no separate modal — just scroll past
the Parent dropdown when you're editing a top-level item.

Editable per item (only visible when the item is at depth 0):

- **This item is a…** and **Plural** — the item's own type name (e.g.
  Layer, Domain, Value Stream). Leave blank to use the global default.
  One top-level can be a "Domain" while another is a "Layer".
- **+ Add depth override** — extends this item's subtree with a
  per-depth override. Each override row lets you set:
  - **Name** and **Plural** — what nodes at that depth are called INSIDE
    this item's subtree. Blank → keep the global label.
  - **Layout** — how children at that depth arrange themselves:
    - **Rows** — stacked vertically
    - **Grid** — responsive tiles (fits as many 260px+ wide tiles as
      the container can hold; more items just wrap to the next row)
    - **Labelled** — coloured block on the left with children on the
      right (how the sheet's Layer bands render)
  - **Frame** — outline / accent-top / accent-left / plain
  - **Detail** — **Summary** (compact tile, click for full record) or
    **Full** (every field laid out inline on the tile)
- Each depth row has a **Remove** button to drop the override back to
  the global schema for that depth.

Adding one override row overrides depth 1 (this item's direct
children). Adding two overrides depth 1 and depth 2. Deeper-than-declared
reuses the deepest override, matching the global "reuses the last entry"
fallback.

Fields (name, description, status) stay shared across the whole drawing
so the status roll-up bar and the legend keep aggregating consistently.
If you need entirely different fields per subtree (e.g., one layer with
`status`, another with `maturity`), that's a separate feature ask.

### Per-parent name overrides

Inside any container, the little **"N capabilities"** count next to its
name is editable in Edit mode. Click the child-type word (or its
singular form when there's exactly one child) and type over it —
that container's kids get relabelled. One Layer can call its children
**Services**, another **Components**, a third can leave them as the
default. The overrides save with the file as `node.childType` /
`node.childTypePlural`.

Use the ncount inline rename when only the LABEL differs; use the
**Subtree layout & depth** section of the detail modal (visible when
you're editing a top-level item) when the subtree needs a different
layout, frame, detail, or depth.

## Saving

The toolbar has these file controls in Edit mode:

- **Save updated file** — writes your changes back into this same file.
- **Save as…** — writes to a new file (a branch or backup).
- **Import…** — loads the drawing from ANOTHER architecture-overview
  file into this one. See [Migrating from an older
  version](#migrating-from-an-older-version) below.

### The first-save flow

The first time you save, the browser shows a native Save dialog. Navigate
to the file, pick the same filename, and confirm "Replace." The browser
grants the page a write handle for that specific file.

### Subsequent saves in the same tab

The handle is remembered — the button relabels to **Save → \<filename>**
and writes straight to disk, no dialog. The page also remembers the handle
**across browser sessions** (in the browser's IndexedDB storage), so
closing and reopening the tab does NOT force you to re-pick the file. The
browser will ask "This site wants to edit a file" one time to renew
permission after a reload.

### The conflict guard

Before overwriting, the code reads the file back from disk and compares
`meta.rev` to your working revision. If someone saved a newer revision
after you opened it, you get a confirm dialog with both revision numbers
and who saved what when. You can proceed (overwrite theirs) or cancel and
reload.

This is best-effort — not real-time collaboration.

## Migrating from an older version

When a new version of `architecture-overview.html` ships (an engine
update — new features, bug fixes), your existing drawings on the old
version can move over in one click:

1. Download the newer `architecture-overview.html` (or open the tracked
   file on the current version).
2. Flip to **Edit** mode.
3. Click **Import…** in the toolbar and confirm the warning.
4. Pick your older file in the file picker.
5. The drawing loads into the new engine. The banner "built on engine
   vN (now vM)" disappears on your next Save.
6. Click **Save updated file** to persist. It writes into the file you
   picked when you originally opened the newer version (or the current
   file if you're editing it in place).

**What comes across:** every layer, every item, every nested item,
comments (with attribution and timestamps), tags, per-node highlights,
per-parent renames, per-layer schema overrides, title, subtitle,
title-block values, notes.

**What does not come across:** the schema (level definitions) of the
older file. The newer engine keeps its own schema. If you had
customised your older file's schema — added fields, renamed levels —
those changes stay in the old file and you'd have to redo them in the
new one (or manually copy the `<script id="schema">` block over in a
text editor).

**What stays the same:** the file location you're saving into, this
file's revision counter and history, and its docId. "Import" replaces
the CONTENT, not the FILE — it doesn't turn your file into the
imported file. Because the revision counter is preserved, the on-disk
conflict guard keeps working; because history is preserved, the audit
trail on this file stays honest (an "Imported from <name>" note is
prepended so the pivot shows up).

The Import button is Chrome/Edge-native via `showOpenFilePicker`;
Firefox and Safari get an equivalent behaviour via a hidden file
input — the UX is identical, the button just uses a different
under-the-hood API.

## SharePoint / Teams workflow

The critical detail: the browser can only write to a real filesystem path.
Opening the file straight from `sharepoint.com` or the Teams Files tab
gives you a web URL, which won't work. You have to go through the sync
client.

1. **Sync the library once.** SharePoint or Teams → the document library
   holding the file → click **Sync**. OneDrive picks it up and keeps a
   local mirror at `~/Library/CloudStorage/OneDrive-…/…` (Mac) or
   `C:\Users\you\<tenant>\<library>\…` (Windows).
2. **Open the file from that local path**, not from the SharePoint web
   view. Finder / File Explorer → the synced folder → double-click the
   `.html`. It opens as a `file://` URL in your default browser (any
   of Chrome, Edge, Safari, or Firefox — see the Browser compatibility
   section below for what differs by browser).
3. Make your edits, click **Save updated file**.
4. In the Save dialog (first time in a new tab), browse back to that same
   synced folder, select the same filename, confirm "Replace."
5. The browser writes locally. **The sync client sees the change on its
   own timer** — usually within seconds. Nothing more from you.
6. Colleagues get your version when they refresh SharePoint or reopen the
   file. Their next save triggers the conflict guard if they had the
   older version loaded.

### Gotchas

- **Teams "Open in browser"** on a file gives you a web URL, not a synced
  path. It won't save. Always come in through the synced folder.
- **Required check-out** on the library: if the library forces check-out,
  someone else has to release it before you can save.
- **Two people editing at the same time**: last-write-wins, with the
  conflict warning as the only protection. Not a real-time collab tool.
- **SharePoint versioning** on the library is your undo — this file has
  none of its own.

## Browser compatibility

Every supported browser opens and edits the file identically — same
drawing, same modal, same tags, same drag-to-reorder, same everything
you can do to the content. What differs is only how **Save** works.

- **Chrome and Edge** (desktop): **save-in-place** via the File System
  Access API. First save picks the file; every save after that in the
  same tab writes silently. Persistent handles remember the file
  across page reloads.
- **Safari** (desktop, macOS): opens and edits normally. Save
  **downloads a fresh copy** of the modified file to your Downloads
  folder. You replace the original manually (drag it into place, or
  Save the download over the original from Safari's Downloads
  window). The `Save as…` button is hidden because it's redundant
  with download.
- **Firefox** (desktop): same as Safari — save downloads a copy, no
  in-place. Everything else works identically.

The takeaway: use Safari or Firefox to view or lightly edit; use
Chrome or Edge for anything with many save cycles.

## Print

- File → Print (or Ctrl/Cmd+P) — the print stylesheet automatically
  strips toolbars, hint banners, action icons, tooltips, and the
  detail modal (an open record never rides into a printout).
- **Print always expands every layer band**, regardless of what's
  collapsed on screen — a printout is meant to show what's IN the
  drawing, and the default load is all-collapsed. This happens for the
  duration of printing only: it doesn't change what's saved to the
  file, doesn't mark the document dirty, and restores exactly what was
  on screen (including a reviewer's own session-only expand/collapse
  clicks in View) once the print dialog closes or is cancelled.
- The title-block metadata always prints as the labelled form, never
  the compact chip row, regardless of which mode or collapse state you
  printed from.
- Landscape orientation is set on `@page`; the sheet fits within the
  drawing box.
- **Verified**: the expand-on-print behaviour and modal-hiding were
  exercised end-to-end in an automated Chromium session — collapsed
  bands expand for print, the saved/session collapse state is restored
  afterward exactly, and the flag never dirties the document. **Not
  yet verified**: physical output from a real printer, or Safari /
  Firefox's print preview specifically (the CSS uses only standard
  `@media print` and `@page` — no browser-specific print APIs — so it
  should behave the same, but that hasn't been confirmed on those
  engines). If you find something broken on a real device (missing
  backgrounds, cut-off content, a browser that doesn't run the
  beforeprint/afterprint expand), report it.

## Large layers

The grid layout (`repeat(auto-fit, minmax(260px, 1fr))`) has no hard
cap on how many items a layer can hold — the browser fits as many
260px+ tiles as the container width allows and wraps the rest to
additional rows, rather than squeezing every item into a fixed number
of columns.

**Verified** against a 20-item layer (mixed statuses, tags, highlights,
long descriptions, one comment) and a 15-item layer with two depth-2
nested subtrees, in both View and Edit, in an automated Chromium
session:

- No clipped text, no tile squeezed below readable width.
- Long descriptions clamp with an ellipsis in View (the tile summary
  clamp), and are fully visible in Edit (the [autosize
  textarea](#editing-inline) added for issue #12).
- A long tile name wraps to multiple lines; the tile grows to fit —
  it doesn't overflow or get cut off.
- Highlight tints and dashed "outside the boundary" frames render
  correctly at scale, don't degrade with many siblings.
- A depth-2 nested subtree inside a 15-item grid renders inline
  inside its parent's tile — the row auto-sizes to the tallest tile,
  without spilling into or overlapping neighbouring cells.
- An empty layer alongside large ones still shows the "No `<items>`
  yet" empty-state chrome (issue #6), not a mismatched card.
- No console errors in either fixture.

**Not yet verified**: physical print output at this scale (see
[Print](#print) — the print stylesheet itself was verified, but not
specifically against a 20+ item layer spanning multiple printed
pages) or a real-world layer with 50+ items.

## Keyboard and accessibility

- Full keyboard navigation via Tab / Shift-Tab.
- Every interactive control has a visible focus outline (3px blue ring
  with a 2px offset — clears WCAG 2.1 AA 1.4.11).
- Text meets WCAG 2.1 AA 1.4.3 contrast (verified across all state
  combinations by a headless audit).
- Every icon-only button has an `aria-label` for screen readers.
- The custom tooltip appears on both hover AND keyboard focus.
- The detail modal is a native `<dialog>` — focus is trapped, Escape
  closes it, and the rest of the page is inert while it's open.

## Common problems

**"I edited a title block field but the Save button didn't turn primary."**
It should — the ● unsaved changes pill also appears. If you don't see it,
check the field actually took your text (click somewhere else to trigger
the input event).

**"I closed the tab and now I have to pick the file again."**
Once — the browser needs to re-request write permission after a full page
reload or a new tab. After you confirm, subsequent saves in that tab go
straight to disk.

**"The picker keeps opening even though I've saved before."**
That's a fresh tab starting a fresh session. The handle stored in
IndexedDB is keyed by the file's `docId` in its meta block — if it can't
find one (the tracked blank ships with an empty docId until first Save),
or the file's docId changed, you get the picker. Copies saved from an
older template that still shared one hardcoded docId can reconnect to
the wrong file — start from a fresh blank, or clear `meta.docId` in the
seed-data block so the next Save mints a new id.

**"I made changes I want to throw away."**
Reload the tab without saving. Nothing you didn't save is persisted.
Comments are the exception — they save as you add them (in-memory) so
they'll be gone on reload too if you never Save, but Cancel on the modal
doesn't discard them.

**"The Save dialog opens every time I click Save updated file, never in-place."**
Save-in-place is Chrome / Edge only — the File System Access API
they rely on isn't in Safari or Firefox. Those browsers download a
fresh copy of the file on every save; you replace the original
manually. On Chrome / Edge, if the Save dialog keeps opening rather
than saving silently, either you're on a fork with security
overrides that block persistent handles, or the browser is
prompting to renew permission (once per tab-open is expected).

**"I renamed a level and now half the labels didn't update."**
Reload the tab (after saving). Most labels update reactively but a few
computed properties cache the level shape; a reload guarantees a fresh
read from the schema.
