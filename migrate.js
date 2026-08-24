#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Builds v2/architecture-overview.html by parsing the source template and
// stamping it into the shared artifact-engine.html.
//
//   node build.js                       -> rebuild everything (currently one file)
//   node build.js architecture-overview -> same, with an explicit filter
//
// Only the overview is still generated from here — the other artifacts have
// been retired (see archive/). The mount-check guard runs after each write
// so a template or JSON error can't ship silently.
// ---------------------------------------------------------------------------
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'v2');
const ENGINE = fs.readFileSync(path.join(DIR, 'artifact-engine.html'), 'utf8');

const DATA_PATTERN   = /(<script type="application\/json" id="seed-data">)[\s\S]*?(<\/script>)/;
const SCHEMA_PATTERN = /(<script type="application\/json" id="schema">)[\s\S]*?(<\/script>)/;
const TITLE_PATTERN  = /<title>[\s\S]*?<\/title>/;

const enc = o => JSON.stringify(o, null, 2).replace(/<\//g, '<\\/');

// Every artifact gets a stable identity at birth. rev 0 means "never saved by a
// person" — the first in-browser save stamps rev 1 with a name against it.
const ENGINE_VERSION = 2;
const meta = () => ({
  docId: require('crypto').randomUUID(),
  schemaVersion: 1, engineVersion: ENGINE_VERSION,
  rev: 0, updatedBy: '', updatedAt: '', history: []
});

// Optional CLI filter kept in place so a future second artifact (or a
// deliberate rebuild of the overview only) still works: pass a substring.
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('-'));

// Every write is followed by a headless mount: if Vue can't compile the
// template or hits a runtime error before mount, we exit non-zero here
// rather than shipping a file that renders raw {{ mustaches }} in a browser.
const mountCheck = require('./mount-check.js');
const pendingChecks = [];

function emit(file, title, schema, data) {
  if (ONLY.length && !ONLY.some(o => file.includes(o))) return;
  let out = ENGINE.replace(TITLE_PATTERN, '<title>' + title + '</title>');
  out = out.replace(SCHEMA_PATTERN, (m, o, c) => o + '\n' + enc(schema) + '\n' + c);
  out = out.replace(DATA_PATTERN,   (m, o, c) => o + '\n' + enc(data)   + '\n' + c);
  fs.mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, file);
  fs.writeFileSync(outPath, out);
  let n = 0; (function count(list){ (list||[]).forEach(x => { n++; count(x.children); }); })(data.nodes);
  console.log(String(file).padEnd(28), n + ' nodes', (data.blocks || []).length + ' notes');
  const r = mountCheck(outPath);
  if (r && typeof r.then === 'function') pendingChecks.push(r.then(
    () => console.log(String(file).padEnd(28), '  ✓ mounts cleanly'),
    e => { pendingChecks.failed = true; }
  ));
}

process.on('beforeExit', () => {
  if (!pendingChecks.length) return;
  Promise.allSettled(pendingChecks).then(() => {
    if (pendingChecks.failed) process.exit(1);
  });
});

let uid = 1;
const nid = () => uid++;

// ===========================================================================
// Architecture overview — parsed out of the contenteditable HTML source
// template. Layers keep their per-layer column count via a node-level override.
// ===========================================================================
(function overview() {
  const src = fs.readFileSync(path.join(DIR, 'architecture_overview_template.html'), 'utf8');
  const text = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const paint = [
    { accent: '#173b73', bg: '#182234' }, { accent: '#0f8a8a', bg: '#152e2d' },
    { accent: '#5b4bb7', bg: '#20182e' }, { accent: '#214d83', bg: '#182234' },
    { accent: '#18866b', bg: '#16281f' }, { accent: '#0a7faa', bg: '#152836' },
    { accent: '#2468b4', bg: '#182234' }
  ];
  uid = 1;
  const nodes = [];
  const layerRe = /<section class="layer ([a-z]+)">([\s\S]*?)<\/section>/g;
  let L, li = 0;
  while ((L = layerRe.exec(src))) {
    const body = L[2];
    const icon  = (body.match(/<div class="icon">([\s\S]*?)<\/div>/) || [, ''])[1].trim();
    const h2    = text((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [, ''])[1]);
    const blurb = text((body.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [, ''])[1]);
    const cols  = Number((body.match(/class="cards cols-(\d)"/) || [, 3])[1]);
    const note  = (body.match(/<div class="note"[^>]*>([\s\S]*?)<\/div>/) || [, ''])[1];

    const kids = [];
    const cardRe = /<article class="card">([\s\S]*?)<\/article>/g;
    let C;
    while ((C = cardRe.exec(body))) {
      const c = C[1];
      const name = text((c.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [, ''])[1]);
      const desc = text((c.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [, ''])[1]);
      // Services from the source template are dropped intentionally — they
      // were hard-coded suggestions. Real sub-capabilities go under this
      // node as children (added via the tile's + button in Edit mode).
      // The source template carried no assessment either, so every capability
      // starts 'unassessed'. Truthful default; the legend turns into a
      // worklist as people fill it in.
      kids.push({ id: nid(), name, desc, status: 'unassessed', comments: [], children: [] });
    }
    const layer = {
      id: nid(), title: h2, blurb, icon, columns: cols,
      accent: paint[li % paint.length].accent, bg: paint[li % paint.length].bg,
      comments: [], children: kids
    };
    if (note) layer.note = text(note);
    nodes.push(layer);
    li++;
  }

  emit('architecture-overview.html', 'Architecture Overview', {
    strict: false, summary: true, presentation: 'sheet',
    // Level labels are display-only. Rename them here (or in the artifact
    // itself via the Rename levels… modal) to match your model — a level 1
    // node could just as easily be a "Component", "Service", "Value Stream",
    // "Domain", or anything else. The engine reads these dynamically via
    // levelLabel(depth); nothing in the render path hard-codes "Capability".
    levels: [
      { label: 'Layer', plural: 'Layers', layout: 'labeled', columns: 3, numberKey: 'icon',
        fields: [
          { key: 'title', label: 'Layer',       type: 'text', primary: true },
          { key: 'blurb', label: 'Description', type: 'textarea', sub: true },
          { key: 'icon',  label: 'Icon text',   type: 'text' },
          { key: 'note',  label: 'Standing note', type: 'textarea' }
        ] },
      // Everything inside a Layer is just an "Item" — same conceptual thing at
      // every depth below the layer. An item can itself hold a list of items,
      // recursively. Levels deeper than declared here inherit this level's
      // schema, so a nested item renders like its parent unless you add more
      // levels via Rename levels… to give the deeper depth its own shape.
      { label: 'Item', plural: 'Items', layout: 'grid', columns: 3, detail: 'summary',
        fields: [
          { key: 'name',     label: 'Name',        type: 'text', primary: true },
          { key: 'desc',     label: 'Description', type: 'textarea', sub: true },
          { key: 'status',   label: 'Status',      type: 'badge', default: 'unassessed',
            options: [
              { value: 'unassessed', label: 'Not assessed', color: '#8b96ad' },
              { value: 'current',    label: 'Current',      color: '#4db38a' },
              { value: 'progress',   label: 'In progress',  color: '#e0b24d' },
              { value: 'planned',    label: 'Planned',      color: '#5b8dd6' },
              { value: 'gap',        label: 'Gap',          color: '#d96a4a' }
            ] }
        ] }
    ]
  }, {
    meta: meta(),
    title: 'Architecture Overview',
    subtitle: 'High-level logical view showing the items in each layer and how they fit together.',
    boardNotes: '',
    // Structured, as the original template had it, rather than flattened into
    // a prose note — the sheet renders these as the drawing's title block.
    titleBlock: {
      'Project / Solution': 'Enter name',
      'Version': '0.1 Draft',
      'Date': 'MM/DD/YYYY',
      'Owner': 'Enter owner'
    },
    blocks: [],
    nodes
  });
})();
