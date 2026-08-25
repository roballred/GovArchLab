# Architecture Overview — User Guide

A single-file HTML artifact you open in a browser to draft, review, and edit
a layered architecture overview. Everything about the drawing — its content,
the schema behind it, and its revision history — lives inside the `.html`
file itself. Save writes the changes back into the same file.

---

## What you're looking at

Open **`architecture-overview.html`** in Chrome or Edge. The page renders as
a bounded engineering-style drawing:

- A **title block** at the top left with the project name and subtitle.
  Underneath is a **collapsed details row** carrying four identifying
  fields (Project / Solution, Version, Date, Owner). Click the little
  ▸ chevron next to it to expand for editing. When collapsed, whichever
  values already have text show up as a compact `KEY value` chip row.
  Printing always shows the details expanded, regardless of the on-screen
  state.
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

Rename them via the **Rename levels…** button in the toolbar (Edit mode).
That modal also lets you add fields, change the layout, and add extra
depths — e.g., a third depth for "Sub-capability", "Sub-service", or
"Feature". Levels beyond the deepest declared one reuse the last level's
schema, so nested nodes render fine even without a new schema entry.

Throughout this guide, **"layer"** means whatever your depth-0 nodes are
called, and **"item"** or occasionally **"capability"** means the depth-1
nodes. When a specific instance name matters, it's noted.

## Two modes: View and Edit

The **View / Edit** toggle at the top switches the whole page between:

- **View** — read-only. What a reviewer or stakeholder should see. All
  input fields hide, description text is static, and only the collapse
  carets remain interactive.
- **Edit** — every field on the page becomes editable in place, action
  icons appear on every node, and the toolbar shows Add, Save, and other
  controls.

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
  Click the ▸ chevron to expand the details, then click into each field.
  Format hints appear underneath each field. **The Date field
  auto-fills to today's date** the first time you focus it while it's
  empty — type over the value to change it, or leave it as-is.
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

Reordering only works among siblings — dragging a Zone onto a
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
  fixed palette to override the auto-assigned band colour. Click the
  same swatch as-is to reset to the auto pick.
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
- The **comments thread**, with an add-a-comment input

### Comments and attribution

Every comment is stamped with your name and the date. Your name lives in
`localStorage` only — never in the file — so multiple people opening the
same file each see their own name. Click **You: \<name>** in the toolbar
(or "Set your name") to change it.

Comments save immediately when you add them, whether you click Save on the
modal or Cancel. Cancel discards field edits, not comments.

### Status field

Each item carries a status (this schema declares it on the depth-1 level;
you can add the same field to other levels via Rename levels…):

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
  Layer, Domain, Zone Model). Leave blank to use the global default.
  One top-level can be a "Zone Model" while another is a "Layer".
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

Inside any container, the little **"N items"** count next to its name is
editable in Edit mode. Click "items" (or "item", if there's exactly one)
and type over it — that container's kids get relabelled without opening
the gear modal. One Layer can call its children **Services**, another
**Components**, a third can leave them as the default. The overrides
save with the file as `node.childType` / `node.childTypePlural`.

Use the ncount inline rename when only the LABEL differs; use the ⚙
gear when the subtree needs a different layout, frame, detail, or depth.

## Saving

The toolbar has two save controls:

- **Save updated file** — writes your changes back into this same file.
- **Save as…** — writes to a new file (a branch or backup).

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
   `.html`. It opens as a `file://` URL in Chrome or Edge.
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

- **Chrome and Edge** (desktop): full save-in-place as described above.
  This is the only fully-supported combination.
- **Firefox and Safari** (desktop): the file opens and edits normally,
  but saving falls back to **downloading a fresh copy** to your
  Downloads folder. You'd have to manually move it to overwrite the
  original. The `Save as…` button is hidden in these browsers because
  it's redundant with download.

## Print

- File → Print (or Ctrl/Cmd+P) — the print stylesheet automatically
  strips toolbars, hint banners, action icons, and tooltips.
- Landscape orientation is set on `@page`; the sheet fits within the
  drawing box.
- **Not yet verified end-to-end against a real printer.** If you find
  something broken (missing backgrounds, cut-off content), report it.

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
find one, or the file's docId changed, you get the picker.

**"I made changes I want to throw away."**
Reload the tab without saving. Nothing you didn't save is persisted.
Comments are the exception — they save as you add them (in-memory) so
they'll be gone on reload too if you never Save, but Cancel on the modal
doesn't discard them.

**"The Save dialog opens even when I click Save updated file, every time."**
Your browser might be blocking the File System Access API's persistent
handles. Check that you're on Chrome or Edge, not a Chromium fork with
security overrides.

**"I renamed a level and now half the labels didn't update."**
Reload the tab (after saving). Most labels update reactively but a few
computed properties cache the level shape; a reload guarantees a fresh
read from the schema.
