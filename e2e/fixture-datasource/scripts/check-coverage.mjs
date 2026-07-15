// Coverage drift guard.
//
// Loads @grafana/plugin-ui at runtime and asserts that every uppercase-named
// function export (i.e. every candidate React component / class) is either
// rendered by the gallery (COVERED_EXPORTS) or explicitly ignored
// (IGNORED_EXPORTS). If a new component is added to the library and nobody wires
// it into the fixture, this fails and points at the missing export names.
//
// The single source of truth for the coverage/ignore lists is
// `src/components/gallery/coverage.json` (also consumed by coverage.ts and the
// Playwright specs).
//
// Loading the library in plain Node is non-trivial: the packed dist consumes
// Grafana packages (which touch `window`, CSS, canvas, etc.) at import time. We
// therefore require the self-contained CommonJS bundle and stub the Grafana /
// DOM-heavy externals with a recursive no-op Proxy. The plugin-ui bundle's own
// module-level code only needs its inlined pure deps (immutable, raqb config,
// etc.), which load fine.

import Module from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const coverage = JSON.parse(
  readFileSync(path.join(here, '..', 'src', 'components', 'gallery', 'coverage.json'), 'utf8')
);

const COVERED_EXPORTS = [...coverage.CONFIG_COVERED, ...coverage.QUERY_COVERED];
const IGNORED_EXPORTS = coverage.IGNORED_EXPORTS;

// ---------------------------------------------------------------------------
// Environment shims so the CommonJS bundle can be required in Node.
// ---------------------------------------------------------------------------

function makeStub() {
  const fn = function () {};
  return new Proxy(fn, {
    get: (target, prop) => {
      if (prop === '__esModule') return true;
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === Symbol.iterator) return undefined;
      if (prop === 'then') return undefined;
      if (prop === 'prototype') return target.prototype;
      return makeStub();
    },
    apply: () => makeStub(),
    construct: () => makeStub(),
    has: () => true,
  });
}

function safeSet(name, value) {
  try {
    globalThis[name] = value;
  } catch {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
}

const domStub = makeStub();
safeSet('window', domStub);
safeSet('document', domStub);
safeSet('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} });
safeSet('Element', function Element() {});
safeSet('HTMLElement', function HTMLElement() {});
safeSet('Node', function Node() {});
safeSet('getComputedStyle', () => ({}));

for (const ext of ['.css', '.scss', '.sass', '.less', '.svg', '.png']) {
  Module._extensions[ext] = (m) => {
    m.exports = {};
  };
}

// Stub the Grafana packages, Emotion, and the DOM-heavy React ecosystem libs.
// Everything else (React itself, immutable, react-awesome-query-builder, etc.)
// loads for real so the library's top-level initialisation succeeds.
const STUB_EXACT = new Set(['react-dom', 'react-redux', 'redux', '@hello-pangea/dnd']);
const shouldStub = (request) => {
  if (request === '@grafana/plugin-ui' || request.startsWith('@grafana/plugin-ui/')) {
    return false;
  }
  return (
    request.startsWith('@grafana/') ||
    request.startsWith('@emotion/') ||
    request.startsWith('react-dom/') ||
    STUB_EXACT.has(request)
  );
};

const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (shouldStub(request)) {
    return makeStub();
  }
  return originalLoad.call(this, request, ...rest);
};

// ---------------------------------------------------------------------------
// Introspect and compare.
// ---------------------------------------------------------------------------

const require = Module.createRequire(import.meta.url);
let lib;
try {
  lib = require('@grafana/plugin-ui');
} catch (err) {
  console.error('check-coverage: failed to load @grafana/plugin-ui for introspection.');
  console.error(err);
  process.exit(2);
}

const candidates = Object.keys(lib).filter((k) => typeof lib[k] === 'function' && /^[A-Z]/.test(k));

const covered = new Set(COVERED_EXPORTS);
const ignored = new Set(IGNORED_EXPORTS);
const missing = candidates.filter((k) => !covered.has(k) && !ignored.has(k));

// Report entries that no longer exist so the lists don't rot silently.
const known = new Set(Object.keys(lib));
const staleCovered = COVERED_EXPORTS.filter((k) => !known.has(k));
const staleIgnored = IGNORED_EXPORTS.filter((k) => !known.has(k));

if (missing.length > 0) {
  console.error('check-coverage: FAILED — uppercase function exports not covered or ignored:');
  for (const name of missing.sort()) {
    console.error(`  - ${name}`);
  }
  console.error(
    '\nRender each in the gallery (and add to CONFIG_COVERED/QUERY_COVERED) or, if it is not a\n' +
      'renderable UI component, add it to IGNORED_EXPORTS in coverage.json.'
  );
  process.exit(1);
}

if (staleCovered.length > 0 || staleIgnored.length > 0) {
  console.error('check-coverage: FAILED — coverage.json references exports that no longer exist:');
  for (const name of [...staleCovered, ...staleIgnored].sort()) {
    console.error(`  - ${name}`);
  }
  process.exit(1);
}

console.log('check-coverage: OK');
console.log(`  library exports:        ${Object.keys(lib).length}`);
console.log(`  candidate components:   ${candidates.length}`);
console.log(`  covered (config+query): ${COVERED_EXPORTS.length}`);
console.log(`  ignored (non-visual):   ${IGNORED_EXPORTS.length}`);
