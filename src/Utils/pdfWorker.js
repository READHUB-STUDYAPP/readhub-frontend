import { pdfjs } from 'react-pdf';

import './mapUpsertPolyfill';
import polyfillSource from './mapUpsertPolyfill.js?raw';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Where pdf.js gets its worker.
 *
 * Imported for its side effect by every screen that touches a PDF, so the
 * answer is given once rather than in four files that can drift apart.
 *
 * Two things are settled here.
 *
 * **The worker is ours, not a CDN's.** It used to be fetched from unpkg, which
 * made opening any PDF depend on a third party being reachable — so a reader on
 * a filtered or slow connection got a spinner and no explanation, and every
 * reader announced their visit to a host we do not control. Vite emits the copy
 * already in `node_modules` and gives us its URL.
 *
 * **The polyfill reaches the worker.** A worker has its own globals, so
 * patching `Map` on the page does not touch it — and the pdf.js code that was
 * actually crashing, the chunked-stream reader that fetches the file, runs on
 * the worker side.
 *
 * Where the browser lacks those methods, the worker is started from a small
 * module that imports the polyfill and then the worker itself. Both are static
 * imports, and those are evaluated in order before the body of the module
 * requesting them, so the patch is in place before pdf.js runs. The two
 * alternatives do not hold: a dynamic `import()` leaves a gap in which pdf.js's
 * test message is dispatched before the worker has attached a listener, and
 * such an event is dropped rather than queued; and inlining the polyfill as the
 * bootstrap's own body would put it *after* the worker, since static imports
 * are hoisted above it.
 */
const supportsUpsert = typeof Map.prototype.getOrInsertComputed === 'function';

if (supportsUpsert) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
} else {
  const asModule = (source) =>
    URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

  // The polyfill's own source, so there is one copy of it rather than a string
  // beside a module that must be kept in step by hand.
  const polyfillUrl = asModule(polyfillSource);

  // Absolute: a blob has its own base URL, and a relative path would resolve
  // against `blob:` and fail.
  const workerHref = new URL(workerUrl, window.location.href).href;

  pdfjs.GlobalWorkerOptions.workerSrc = asModule(
    `import ${JSON.stringify(polyfillUrl)};\nimport ${JSON.stringify(workerHref)};\n`,
  );
}
