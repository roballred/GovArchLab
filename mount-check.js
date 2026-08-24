// ---------------------------------------------------------------------------
// Boot a produced .html in a headless DOM and confirm Vue actually mounted.
//
// Nothing about the .html would tell you it's broken until someone opened it
// in a browser: unclosed template literals, malformed embedded JSON, a runtime
// error before mount all yield the same failure mode — the page renders raw
// {{ mustaches }} and the whole app is dead. This check turns that into an
// exit-1 at build time so a broken artifact never leaves this repo.
//
// jsdom is a devDependency; a fresh checkout picks it up via `npm install`.
// If it's missing, we skip with a loud warning rather than failing the build,
// so the repo still functions for anyone who hasn't run install yet.
// ---------------------------------------------------------------------------
'use strict';
const fs = require('fs');

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
  module.exports = function mountCheckMissing(filePath) {
    // Loud so no one thinks the check ran silently.
    console.warn('  ⚠ jsdom not installed — mount check SKIPPED for ' + filePath);
    console.warn('    run `npm install` from the project root to enable it');
  };
  return;
}

module.exports = function mountCheck(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const vc = new VirtualConsole();
  const errs = [];
  vc.on('jsdomError', e => errs.push((e.detail && e.detail.stack) || e.message || String(e)));

  // file:// gives jsdom an "opaque origin" that blocks localStorage; the
  // artifact reads localStorage on mount, so we boot under http://localhost/.
  // The URL doesn't have to resolve — jsdom never fetches from it, it just
  // needs a non-opaque origin.
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    url: 'http://localhost/' + require('path').basename(filePath),
  });

  // Vue mounts synchronously on script eval; give the event loop one tick
  // to let any queued microtasks (Vue's scheduler) settle.
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const doc = dom.window.document;
      const app = doc.getElementById('app');
      const mounted = !!(app && app._vnode);
      // Extra: prove Vue actually rendered something into #app, not just
      // that a component instance was created. When template compilation
      // fails silently (rare) or the seed data crashes render, _vnode can
      // be present but #app stays as the raw markup with mustaches.
      const wrapRendered = !!(app && app.querySelector && app.querySelector('.wrap'));

      dom.window.close();

      if (!mounted || !wrapRendered || errs.length) {
        console.error('  ✗ mount check FAILED for ' + filePath);
        if (!mounted)      console.error('    - Vue never mounted (app._vnode is null)');
        if (!wrapRendered) console.error('    - Vue mounted but nothing rendered into #app');
        for (const e of errs) console.error('    - ' + String(e).split('\n').slice(0, 3).join('\n      '));
        reject(new Error('mount check failed: ' + filePath));
      } else {
        resolve();
      }
    }, 250);
  });
};
