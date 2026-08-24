# AI Session Start

This is the canonical "read me before doing anything" document for an AI session working on GovArchLab. It exists so the per-session context blob a human pastes when starting a new session can shrink to a single pointer at this file.

If anything below conflicts with [Standards.md](../Standards.md), **Standards.md governs.** If something here is wrong, edit it — the file is in git, the change is reviewable.

---

## Read in this order

1. **[`Standards.md`](../Standards.md)** — the governing document. Defines the EasyEA framing, persona validation rules, traceability convention, ARB workflow, and the "humans merge PRs" rule. Everything else extends it.
2. **[`CLAUDE.md`](../CLAUDE.md)** — Claude-specific workflow context. The pre-flight checklist (issue → capability → persona → acceptance criteria), the per-commit / per-PR traceability format, and — most importantly — the **two-file model** rule that has failed multiple times in past sessions.
3. **[`README.md`](../README.md)** — what GovArchLab is, how to build it, where the deliverable lives, how to keep a private working file separate from the tracked sample.
4. **[`v2/architecture-overview-documentation.md`](../v2/architecture-overview-documentation.md)** — the deliverable's user guide. How the artifact is used, not how it's built.
5. **[`v2/architecture-overview.md`](../v2/architecture-overview.md)** — deep AI-context handoff: engine architecture, design decisions, retired features, common pitfalls. Read this before touching `artifact-engine.html`.

---

## What GovArchLab is (one paragraph)

A single-file HTML artifact for drafting, reviewing, and editing a layered architecture overview. The deliverable is [`v2/architecture-overview.html`](../v2/architecture-overview.html). Vue 3 is vendored inline and SHA-256 verified at build time. The only dev dependency is `jsdom`, used by the build-time mount check. No server, no DB, no runtime network calls. Every feature must fit inside those constraints — proposals that add a server, database, auth layer, or runtime network dep are architectural pivots, not features.

---

## Where current work lives

| Question | Where to look |
|---|---|
| What is the deliverable? | [`v2/architecture-overview.html`](../v2/architecture-overview.html) — tracked, sample data only |
| Is a live drawing in play? | Check for `v2/*-mine.html` or `v2/.local-*.html` — those are private working copies, gitignored |
| What are the open issues? | `PATH="/opt/homebrew/bin:$PATH" gh issue list --repo roballred/GovArchLab` |
| What was decided in the last 30 days? | `PATH="/opt/homebrew/bin:$PATH" gh pr list --repo roballred/GovArchLab --state merged --limit 30` |
| Why is a piece of the engine shaped the way it is? | The comments in `artifact-engine.html` (they explain **why**, not just what) and the "Design decisions with context" section of `v2/architecture-overview.md` |

---

## Pre-flight before writing any code

Per `CLAUDE.md`:

1. **Issue exists.** A GitHub issue with defined scope and acceptance criteria. If the maintainer hands you a task informally, create the issue first and confirm before writing code.
2. **Capability traceability.** Issue body has `Capability: <id>`. GovArchLab does not yet have its own `business-architecture/` directory — capability IDs may reference GovEA capabilities or EasyEA framework capabilities where the work overlaps; create a GovArchLab-local capability doc when the concept is genuinely new to this tool.
3. **Persona is identified.** Issue body has `Persona: <name>`. Likely draws from the GovEA persona set (`enterprise-architect`, `agency-ea-coordinator`, `domain-architect`, `elected-official`, `business-stakeholder`) until GovArchLab defines its own.
4. **Acceptance criteria are clear enough to know when the work is done.**

If any of those four can't be satisfied, stop and resolve it before proceeding.

---

## The two-file model (drift-prone; read before every edit)

- **Tracked file:** `v2/architecture-overview.html`. Carries generic sample data (7 example layers). Anyone can rebuild it from `architecture_overview_template.html` at any time — no live data to lose.
- **Private files:** `v2/*-mine.html` and `v2/.local-*.html`. `.gitignore` excludes both. Each author edits and saves against their own private file; the Save button in the app writes back to whichever file the browser opened.

**Never run `node build.js` or `node migrate.js` against a file that carries live user data.** Both stamp fresh seed JSON from the template and destroy anything else in the file. This has failed multiple times in past sessions — the rule exists because the mistake keeps recurring, not as a theoretical concern.

Safe engine edits mirror surgical `Edit` changes into both `artifact-engine.html` and `v2/architecture-overview.html` (and any `-mine.html` files that need to inherit the fix). Do not go through `build.js` to sync them if a live drawing is anywhere in the repo.

---

## Verification workflow

Every engine change must clear the mount check. Run it without going through `build.js`:

```bash
node -e "require('./mount-check.js')('./v2/architecture-overview.html').then(() => console.log('✓ mounts cleanly'), e => { console.error('✗', e.message); process.exit(1); })"
```

The check boots the produced `.html` in a headless jsdom, waits ~250ms for Vue's scheduler to settle, and confirms that:

1. Vue actually mounted (`app._vnode` is set), and
2. The template compiled and rendered something into `#app` (`.wrap` exists).

If either fails, the build was broken by the edit — fix before proceeding. See the "jsdom mount-check" section of the AI-context handoff for the specific edge cases this catches (backtick-in-template-comment, malformed embedded JSON, runtime error before mount).

For behaviour verification, write a small jsdom-based script in the scratchpad that boots the produced file, drives the relevant methods on the Vue instance, and checks DOM outcomes. Several such scripts already exist in past session transcripts — the pattern is: `require jsdom` → construct with `runScripts: 'dangerously'`, `pretendToBeVisual: true`, `url: 'http://localhost/…'` → `setTimeout` 250ms → assert.

---

## Operating policies (the ones that drift)

These are the rules the per-session bootstrap blob used to repeat because they drift. They live here now so the source of truth is git-tracked.

### Never overwrite live user data

Repeated because it has failed multiple times. Before running `node build.js` or `node migrate.js`, verify that `v2/architecture-overview.html` matches the seed template. If it contains anything else — a real drawing, custom layers, comments with real attributions — either back it up to a `-mine.html` first or patch the engine surgically and mirror the same edit into the deliverable. Do not rebuild silently.

### GitHub CLI

Used in nearly every session. Two reliable gotchas:

1. **PATH**: `/opt/homebrew/bin/gh` is not in PATH by default on macOS. Prefix with `PATH="/opt/homebrew/bin:$PATH" gh ...`.
2. **CWD**: `gh` operates on the repo at the current working directory. `cd` to the repo root first; worktrees count as separate repos.

Use `gh` for: filing issues, opening PRs, reading PR comments / past decisions, checking CI (`gh pr view <n> --json statusCheckRollup`), reading job logs. Never use it to merge a PR — humans merge.

### Don't rebuild the Vue vendor blob by hand

The vendored Vue in `vendor/vue-<version>.global.prod.js` is pinned and its SHA-256 hash is verified at build time. To upgrade, replace the blob AND update `EXPECTED_SHA256` in `build.js`. Editing one without the other makes `node build.js` refuse to run — that's the safeguard working, not a bug.

---

## Capability and persona traceability

Every commit that touches implementation must include the capability ID in the message body:

```
feat(<area>): <short summary>

Capability: <capability-id>
Closes #<issue>
```

Every PR description must include:

- `Closes #<issue>` (or `Refs #<issue>` if not yet closing)
- `Capability: <capability-id>` (or `Capability group: <group>`)
- `Persona: <persona>` (one or more)
- Short explanation of what changed, why, and how it was verified (mount check output at minimum; behaviour test outcome if the change touched a user-facing method)

Capability IDs are file stems under `business-architecture/capabilities/` — when GovArchLab's own dir exists — or file stems from GovEA's `business-architecture/capabilities/` when the work overlaps. Persona IDs are file stems from the shared persona set.

---

## Don'ts

- Don't merge PRs. Humans merge.
- Don't push directly to `main`. PRs only.
- Don't skip pre-flight. Issue → capability → persona → acceptance criteria, in that order.
- Don't bypass CI hooks (`--no-verify`).
- Don't force-push to `main`.
- Don't commit `v2/*-mine.html`, `v2/.local-*.html`, or any private working copy of the deliverable.
- Don't run `node build.js` or `node migrate.js` against a file that might carry live user data. See "Two-file model" above.
- Don't add a runtime dependency the browser must fetch from the network. GovArchLab's whole reason for existing is that it works from a single self-contained file.
- Don't ship a change that fails the mount check.

---

## When this doc is wrong

Edit it. It's in git, it's reviewable. If a session blob has to paste context that already lives somewhere else in this repo, the right fix is to point the blob at the source — not to copy the content into the blob.
