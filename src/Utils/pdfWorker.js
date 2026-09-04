import { pdfjs } from 'react-pdf';

import './mapUpsertPolyfill';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

/**
 * Where pdf.js gets its worker.
 *
 * Imported for its side effect by every screen that touches a PDF, so the
 * answer is given once rather than in four files that can drift apart.
 *
 * It used to be fetched from unpkg, which made opening any PDF depend on a
 * third party being reachable — a spinner and no explanation on a filtered or
 * slow connection, and every reader announcing their visit to a host we do not
 * control. The copy in node_modules is used instead.
 *
 * `?worker` rather than `?url`, and `workerPort` rather than `workerSrc`,
 * because a URL is not enough: in development Vite serves the file from
 * node_modules untransformed, the browser refuses it as a module worker, and
 * pdf.js falls back to importing it on the main thread — which fails too, with
 * "Setting up fake worker failed". `?worker` hands us a Worker constructor
 * Vite has bundled properly for both development and the build, so there is no
 * URL to resolve and nothing to get wrong.
 *
 * The version must match the pdf.js react-pdf carries, or every document is
 * refused with "The API version does not match the Worker version"; the app
 * pins `pdfjs-dist` to exactly react-pdf's version so there is one copy.
 */
pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
