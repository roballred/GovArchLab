#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Inlines the vendored Vue into artifact-engine.html, then re-stamps every
// artifact in v2/ from that engine.
//
//   node build.js
//
// Idempotent: the vendor block is matched by id, so rerunning replaces it
// rather than stacking copies. Nothing here touches the network.
// ---------------------------------------------------------------------------
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = __dirname;
const ENGINE = path.join(DIR, 'artifact-engine.html');
const VENDOR = path.join(DIR, 'vendor', 'vue-3.5.41.global.prod.js');
const EXPECTED_SHA256 = '45c5186437878319a4b86339f475e8e2f0b27e1752f9e6387ebb15854425847f';

const lib = fs.readFileSync(VENDOR, 'utf8');

// The vendored file is trusted only because we can prove it hasn't changed.
const sha = crypto.createHash('sha256').update(lib).digest('hex');
if (sha !== EXPECTED_SHA256) {
  console.error('vendor hash mismatch\n  expected ' + EXPECTED_SHA256 + '\n  actual   ' + sha);
  process.exit(1);
}
// A literal closing script tag anywhere in the library would truncate the page.
if (/<\/script/i.test(lib)) { console.error('vendor contains a closing script tag; cannot inline'); process.exit(1); }

let src = fs.readFileSync(ENGINE, 'utf8');
const before = src.length;

const CDN    = /<script src="https:\/\/[^"]*vue[^"]*"><\/script>/;
const VENDOR_BLOCK = /<script id="vendor-vue">[\s\S]*?<\/script>/;

const block = '<script id="vendor-vue">\n' + lib + '\n<\/script>';

if (VENDOR_BLOCK.test(src))      src = src.replace(VENDOR_BLOCK, () => block);   // re-inline
else if (CDN.test(src))          src = src.replace(CDN, () => block);            // first time
else { console.error('no vue script tag found in artifact-engine.html'); process.exit(1); }

if (/https:\/\/cdn\.|https:\/\/unpkg\./.test(src)) {
  console.error('a remote reference survived; refusing to write'); process.exit(1);
}

fs.writeFileSync(ENGINE, src);
console.log('artifact-engine.html  ' + (before/1024).toFixed(0) + 'KB -> ' + (src.length/1024).toFixed(0) + 'KB (vue inlined, no network refs)');

require('./migrate.js');
