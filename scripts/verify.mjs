#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Minimum-viable verification for architecture-overview.html.
//
// This is NOT a test framework and does not try to be one. It is the
// mechanical version of the manual "reload and confirm no {{ mustaches }}"
// check the README has asked contributors to do by hand since the radical
// trim (commit f8aa32b) removed the old build/mount-check pipeline. Every
// bug fixed across issues #1-#15 and #19 would have been caught here before
// it reached main.
//
// Checks, in order, any one of which exits 1:
//   1. #schema and #seed-data blocks parse as JSON.
//   2. Vue actually mounts: #app has a rendered subtree, no raw {{ mustache }}
//      text remains anywhere on the page, and the sheet's .wrap element
//      exists (proves the template rendered past the root, not just that a
//      component instance was created).
//   3. The save-file serializer's block-replace regexes still find their
//      targets and produce valid JSON when run against a fixture — this is
//      the exact mechanism buildFile() uses, so a regex or escaping
//      regression here is a real "Save would corrupt the file" bug.
//
// Depends only on jsdom (a devDependency — `npm install` picks it up). No
// other test framework, no build step, no bundler.
// ---------------------------------------------------------------------------
'use strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'architecture-overview.html');

const DATA_PATTERN   = /(<script type="application\/json" id="seed-data">)[\s\S]*?(<\/script>)/;
const SCHEMA_PATTERN = /(<script type="application\/json" id="schema">)[\s\S]*?(<\/script>)/;

let failures = 0;
function fail(msg) {
  failures += 1;
  console.error('  ✗ ' + msg);
}
function pass(msg) {
  console.log('  ✓ ' + msg);
}

function extractBlock(html, id) {
  const re = new RegExp(
    '<script type="application/json" id="' + id + '">([\\s\\S]*?)</script>'
  );
  const m = html.match(re);
  if (!m) return null;
  return m[1].trim();
}

async function main() {
  console.log('Verifying ' + path.basename(FILE) + '\n');
  const html = readFileSync(FILE, 'utf8');

  // ---- Check 1: schema and seed-data JSON parse ---------------------------
  console.log('1. Embedded JSON blocks');
  const schemaText = extractBlock(html, 'schema');
  const seedText    = extractBlock(html, 'seed-data');
  let schema = null, seed = null;

  if (!schemaText) fail('no #schema block found');
  else {
    try { schema = JSON.parse(schemaText); pass('#schema parses (' + (schema.levels || []).length + ' level(s))'); }
    catch (e) { fail('#schema JSON.parse failed: ' + e.message); }
  }
  if (!seedText) fail('no #seed-data block found');
  else {
    try { seed = JSON.parse(seedText); pass('#seed-data parses (' + (seed.nodes || []).length + ' top-level node(s))'); }
    catch (e) { fail('#seed-data JSON.parse failed: ' + e.message); }
  }

  // ---- Check 2: Vue actually mounts ---------------------------------------
  console.log('\n2. Mount check (jsdom)');
  let JSDOM, VirtualConsole;
  try {
    ({ JSDOM, VirtualConsole } = await import('jsdom'));
  } catch (e) {
    console.warn('  ⚠ jsdom not installed — mount check SKIPPED');
    console.warn('    run `npm install` from the project root to enable it');
  }
  if (JSDOM) {
    const vc = new VirtualConsole();
    const jsErrors = [];
    vc.on('jsdomError', e => jsErrors.push((e.detail && e.detail.stack) || e.message || String(e)));

    // file:// gives jsdom an opaque origin that blocks localStorage, which
    // the app reads on mount (author name). Boot under http://localhost/
    // instead — jsdom never actually fetches from it.
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      virtualConsole: vc,
      url: 'http://localhost/architecture-overview.html',
    });

    await new Promise(r => setTimeout(r, 300));

    const doc = dom.window.document;
    const app = doc.getElementById('app');
    const mounted = !!(app && app.__vnode || app && app._vnode || (app && app.children && app.children.length));
    const wrapRendered = !!(app && app.querySelector && app.querySelector('.wrap'));
    // Scope to #app's OWN rendered text, not document.body — body.textContent
    // also concatenates the JS source inside the bottom <script> tag, whose
    // template-literal strings legitimately contain "{{ ... }}" as JS source
    // text (that's the un-compiled template Vue reads at mount time, not
    // rendered output). #app contains no <script> descendants, so its
    // textContent is exactly what mounted, live rendered markup, and a
    // leftover mustache there really does mean the template failed to
    // compile.
    const appText = app ? (app.textContent || '') : '';
    const hasMustache = /\{\{[^}]*\}\}/.test(appText);

    dom.window.close();

    if (!mounted) fail('Vue never mounted (#app has no rendered children)');
    else pass('#app has rendered children');

    if (!wrapRendered) fail('Vue mounted but the .wrap sheet element never rendered');
    else pass('.wrap sheet element rendered');

    if (hasMustache) fail('raw {{ mustache }} text found on the page — template did not compile');
    else pass('no raw {{ mustache }} text on the page');

    if (jsErrors.length) {
      for (const e of jsErrors) fail('runtime error: ' + String(e).split('\n')[0]);
    } else {
      pass('no jsdom runtime errors');
    }
  }

  // ---- Check 3: save-file serializer round-trips a fixture -----------------
  console.log('\n3. Save serializer (buildFile pattern) round-trip');
  if (seed) {
    const fixtureSeed = JSON.parse(JSON.stringify(seed));
    fixtureSeed.title = 'Verify Fixture </script> <script>alert(1)</script>';
    const enc = o => JSON.stringify(o, null, 2).replace(/<\//g, '<\\/');
    const rebuilt = html.replace(DATA_PATTERN, (m, open, close) => open + '\n' + enc(fixtureSeed) + '\n' + close);

    if (rebuilt === html) {
      fail('DATA_PATTERN did not match — seed-data block was not replaced');
    } else {
      const check = rebuilt.match(DATA_PATTERN);
      try {
        const reparsed = JSON.parse(
          check[0].replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '').trim()
        );
        if (reparsed.title !== fixtureSeed.title) {
          fail('round-tripped title does not match — escaping regression');
        } else {
          pass('DATA_PATTERN replace + reparse round-trips a fixture with </script> in a field');
        }
      } catch (e) {
        fail('rebuilt seed-data does not parse as JSON: ' + e.message);
      }
    }

    if (!SCHEMA_PATTERN.test(html)) {
      fail('SCHEMA_PATTERN did not match the current file');
    } else {
      pass('SCHEMA_PATTERN matches the current file');
    }
  } else {
    console.log('  (skipped — seed-data did not parse in check 1)');
  }

  // ---- Summary --------------------------------------------------------------
  console.log('');
  if (failures) {
    console.error(failures + ' check(s) failed.');
    process.exit(1);
  } else {
    console.log('All checks passed.');
  }
}

main().catch(e => {
  console.error('verify.mjs crashed: ' + (e && e.stack || e));
  process.exit(1);
});
