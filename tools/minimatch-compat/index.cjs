"use strict";

// Some ESLint plugins still call require("minimatch") directly. Delegate
// every operation to patched upstream minimatch; no legacy matcher is bundled.
// CommonJS is required by the legacy ESLint/plugin API this adapter preserves.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const modern = require("minimatch-modern");
module.exports = Object.assign(modern.minimatch, modern);
// Explicit properties also expose named imports to Node's CJS/ESM bridge.
module.exports.minimatch = modern.minimatch;
module.exports.Minimatch = modern.Minimatch;
module.exports.filter = modern.filter;
module.exports.match = modern.match;
// 11.0.4 no longer exports makeRe; import/no-internal-modules only calls
// .test() on the result, so return a matcher-backed stand-in, not a regex.
module.exports.makeRe = (pattern, options) => ({
  test: (path) => modern.minimatch(path, pattern, options),
});
module.exports.defaults = modern.defaults;
module.exports.braceExpand = modern.braceExpand;
module.exports.escape = modern.escape;
module.exports.unescape = modern.unescape;
module.exports.GLOBSTAR = modern.GLOBSTAR;
module.exports.sep = modern.sep;
