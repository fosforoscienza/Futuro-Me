# Minimatch compatibility for the lint toolchain

ESLint and React/import plugins still depend on the callable CommonJS API of
minimatch 3. The security fix for GHSA-g3hv-75wg-m249 is in minimatch 11.0.1+.
This local private adapter exposes both the old callable export and the new
named exports, delegating all matching to upstream **11.0.4** (npm alias
`minimatch-modern`). It does not copy, patch or retain the affected matcher.

The npm override selects this adapter for the legacy dependency name; the
patched library is installed under the separate alias. Audit remains
enabled for the complete dependency tree, including the real modern package.
Remove this adapter and its override when upstream lint dependencies migrate.

Validation: `npm run lint`, compatibility tests and build. The modern matcher
can intentionally reject pathological patterns which old versions accepted.
No user-controlled glob patterns are used by this application.
