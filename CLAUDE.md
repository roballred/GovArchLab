# GovArchLab — Project Instructions for Claude

> **Start here for any new AI session:** [`docs/AI-SESSION-START.md`](./docs/AI-SESSION-START.md) is the canonical session-bootstrap doc. It points at every other source of truth (Standards.md, this file, [README.md](./README.md), the deliverable's user guide, the AI-context handoff) and captures the operating policies that drift — safe engine edits, the tracked-vs-`-mine` two-file model, GitHub CLI gotchas, and the "never rebuild silently over live user data" rule.
>
> **Governing document:** [Standards.md](./Standards.md) defines the principles, workflow, and traceability requirements for all AI-assisted work on this project. This file extends those standards with Claude-specific context. If anything here conflicts with Standards.md, Standards.md governs.

## What This Is

**GovArchLab** is a free, open-source tool for drafting, reviewing, and editing a **layered architecture overview** as a single self-contained HTML file. Open the file in a browser, work in it, save — the changes are written back into the same `.html` file, so it round-trips through email, SharePoint, or any other file transport with no server involved.

The deliverable is one file: [`v2/architecture-overview.html`](./v2/architecture-overview.html). Everything else in this repo exists to produce or maintain it.

GovArchLab is part of the same lightweight, people-centered methodology family as [GovEA](https://github.com/roballred/GovEA) and [GovCore](https://github.com/roballred/GovCore), rooted in the [EasyEA](https://github.com/roballred/EasyEA) framework:

- Persona-first: capabilities trace back to a real user need.
- Plain-language outputs that non-technical stakeholders (elected officials, department directors, agency staff) can read.
- Small, self-contained deliverables that don't require a platform team to run.

---

## EasyEA Reference

The methodology behind every `Gov*` repo lives at https://github.com/roballred/EasyEA. Key concepts:

- People-centered: start with personas, not systems.
- 7-step lightweight workflow.
- ARB review with 10 distinct reviewer personas.
- Plain-language outputs for elected officials and non-technical stakeholders.

For pre-flight capability traceability, GovArchLab currently references capabilities from the broader EasyEA framework and from [GovEA's `business-architecture/`](https://github.com/roballred/GovEA/tree/main/business-architecture) directory where they overlap (personas that would use an architecture overview tool: `enterprise-architect`, `agency-ea-coordinator`, `domain-architect`, `elected-official`). GovArchLab does not yet have its own `business-architecture/` directory; when the tool's shape stabilises and its persona/capability set is distinct enough to warrant its own docs, add one under this repo following the folder structure in [Standards.md](./Standards.md).

---

## Product Shape

GovArchLab is intentionally small:

- **One HTML file** to ship. No server, no DB, no build-time dependencies at runtime, no CDN.
- **Vue 3** vendored inline (SHA-256 verified at build time) — the only runtime dep.
- **jsdom** as the only dev dependency, used by the build-time mount check.
- **No user roles.** Anyone who has the file can view or edit it. Access control is whatever the file transport (email, SharePoint, filesystem permissions) provides.

If a proposal would add a server, a database, an auth layer, or a runtime dependency the browser needs to fetch from the network, stop and confirm with the maintainer before proceeding — those are architectural pivots, not features.

---

## Two-File Model — Never Overwrite Live User Data

This is the single most important operating rule in this repo. It has failed multiple times in earlier sessions.

**Tracked file (`v2/architecture-overview.html`)** carries generic sample data — the 7 example layers stamped from `architecture_overview_template.html`. This is what ships in the repo, what viewers see on the public `main`, and what `node build.js` regenerates from source. **Anyone can rebuild it at any time; there is no live user data here to lose.**

**Private working files (`v2/*-mine.html`, `v2/.local-*.html`)** are per-author copies where a real drawing lives. `.gitignore` excludes both patterns so they never reach the tracked repo. The Save button in the app writes back to the file the browser opened — if that's a `-mine.html`, saves stay private.

**Never run `node build.js` (or `node migrate.js`) against a file that carries live user data.** Both commands stamp the seed JSON from `architecture_overview_template.html` and replace whatever was in the deliverable. If a file might have real work in it, either:

1. **Copy the live file to `v2/architecture-overview-mine.html` first** so the private working copy is preserved, then rebuild the tracked file safely, OR
2. **Patch the engine surgically** with `Edit` calls to `artifact-engine.html` AND mirror the same edits into the live file — do not go through `build.js`, OR
3. **Get explicit sign-off** from the maintainer that a seed reset is fine.

The mount check (`mount-check.js`) can be called directly without `build.js` for verifying engine changes:

```bash
node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓ mounts cleanly'), e => { console.error('✗', e.message); process.exit(1); })"
```

---

## Development Workflow

### One-shot build

Rebuilds the tracked deliverable from source. **Only run against the tracked file, never against a `-mine` file.**

```bash
npm install                       # first time only — pulls jsdom
node build.js                     # inlines Vue → engine, stamps deliverable, mount-checks
```

### Safe engine edit (data-preserving)

When changing engine behaviour (CSS, template, JS in `artifact-engine.html`), mirror the same textual `Edit` into `v2/architecture-overview.html` directly. Do not run `build.js`. Then verify with the standalone mount-check above.

If a `-mine.html` file also needs the same engine change, mirror it there too — the private file uses the same engine.

### Vendor Vue refresh

Rare — only when upgrading Vue. Replace the pinned blob in `vendor/vue-*.global.prod.js`, update `EXPECTED_SHA256` in `build.js` to the new hash, then `node build.js`. The SHA verify will fail if the blob and constant get out of sync.

---

## GitHub

Repo: https://github.com/roballred/GovArchLab

For GitHub CLI use, on macOS: `PATH="/opt/homebrew/bin:$PATH" gh …`. See [`docs/AI-SESSION-START.md`](./docs/AI-SESSION-START.md) for the full GitHub CLI section.

---

## Pre-Flight Checklist — Required Before Writing Any Code

Before implementing anything, work through every item below in order. If any item cannot be satisfied, stop and resolve it before proceeding. Do not start implementation to "figure it out as you go."

### 1. Issue exists

A GitHub issue must exist with defined scope and acceptance criteria. If the maintainer hands me a task informally (chat message, verbal request), I must **create the issue first** and confirm its content before writing code. No exceptions.

### 2. Capability traceability is present

The issue must include a `Capability:` or `Capability group:` line referencing the relevant EasyEA capability ID (the file stem of the capability doc). Because GovArchLab does not yet have its own `business-architecture/` directory, capability IDs may reference:

- A capability in [GovEA's `business-architecture/capabilities/`](https://github.com/roballred/GovEA/tree/main/business-architecture/capabilities) when the work overlaps.
- A capability defined by the [EasyEA framework](https://github.com/roballred/EasyEA) directly.
- A new capability specific to GovArchLab — in which case create the capability doc under a new `business-architecture/capabilities/` directory in this repo before opening the issue.

If no capability doc fits, say so explicitly on the issue instead of inventing a capability ID.

### 3. Persona is identified

The issue should name the persona(s) the work serves. Likely GovArchLab personas draw from the same set as GovEA (`enterprise-architect`, `agency-ea-coordinator`, `domain-architect`, `elected-official`, `business-stakeholder`). If a change cannot be tied to a persona need or business goal, flag it and ask the maintainer to confirm why it should exist.

### 4. Acceptance criteria are clear

The issue should have enough detail to know when the work is done. If acceptance criteria are missing or vague, ask before implementing.

---

## Traceability in Every Commit and PR

Every commit that touches implementation must include the capability ID in the message body:

```
feat(engine): add per-item highlight tint

Capability: <capability-id>
Closes #N
```

Every PR description must include:

- `Closes #N` referencing the issue
- `Capability: [id]` referencing the capability
- `Persona: [persona]` when applicable
- A short explanation of what changed, why, and how it was tested (at minimum: mount check passes, no user data was overwritten)

This is not optional — it is the mechanism that makes AI-assisted work auditable and trustworthy.
