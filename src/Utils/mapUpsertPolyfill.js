/**
 * `Map.prototype.getOrInsert` and `getOrInsertComputed`, for browsers that
 * predate them.
 *
 * pdf.js calls these throughout, and they are a very recent addition to the
 * language. A browser a year or two old does not have them, and pdf.js dies
 * with "getOrInsertComputed is not a function" — which on the phone app was a
 * hard crash on upload, on a device perfectly capable of showing a PDF.
 *
 * Written as a plain side-effect module with no imports, because it is loaded
 * two ways: imported normally for the page, and by URL from inside the pdf.js
 * worker, which has its own globals and cannot see anything patched out here.
 *
 * Both methods follow the specification: look the key up, insert only when it
 * is missing, return whatever is there afterwards. Where the runtime already
 * has them, this does nothing.
 */

/* eslint-disable no-extend-native -- Extending the built-in is precisely a
   polyfill's job. Both are defined only when absent, match the specified
   behaviour, and are non-enumerable like the real thing. */

const define = (name, implementation) => {
  if (typeof Map.prototype[name] === 'function') return;

  // Non-enumerable, like a built-in: a `for...in` over a Map should not start
  // turning these up.
  Object.defineProperty(Map.prototype, name, {
    value: implementation,
    writable: true,
    configurable: true,
    enumerable: false,
  });
};

define('getOrInsert', function getOrInsert(key, value) {
  if (!this.has(key)) this.set(key, value);
  return this.get(key);
});

define('getOrInsertComputed', function getOrInsertComputed(key, callback) {
  // The callback runs only on a miss — that is the point of the method, and
  // pdf.js relies on it: several of its callbacks build fonts and compiled
  // glyphs that are expensive to make twice.
  if (!this.has(key)) this.set(key, callback(key));
  return this.get(key);
});
