import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
const require = createRequire(import.meta.url);
const matcher = require("minimatch");

test("legacy callable and modern named APIs delegate to the patched matcher", () => {
  assert.equal(typeof matcher, "function");
  assert.equal(matcher, matcher.minimatch);
  assert.equal(matcher("src/app/page.tsx", "**/*.{ts,tsx}"), true);
  assert.equal(matcher("src/app/page.css", "**/*.{ts,tsx}"), false);
  assert.equal(matcher(".claude/worktrees/page.ts", ".claude/**", { dot: true }), true);
  assert.equal(matcher("src/index.ts", "!**/*.js"), true);
  assert.equal(new matcher.Minimatch("**/*.tsx").match("src/page.tsx"), true);
  assert.deepEqual(matcher.match(["a.ts", "a.js"], "*.ts"), ["a.ts"]);
  assert.equal(matcher.filter("*.ts")("a.ts"), true);
  assert.equal(matcher.makeRe("*.ts").test("a.ts"), true);
  assert.deepEqual(matcher.braceExpand("*.{ts,tsx}"), ["*.ts", "*.tsx"]);
  assert.equal(matcher.defaults({ nocase: true })("PAGE.TS", "*.ts"), true);
});

test("overridden dependencies use the adapter and a real patched upstream", () => {
  for (const dependency of ["eslint", "@eslint/eslintrc", "eslint-plugin-import", "eslint-plugin-react", "eslint-plugin-jsx-a11y", "@typescript-eslint/typescript-estree"]) {
    const fromConsumer = createRequire(require.resolve(dependency));
    const used = fromConsumer("minimatch");
    assert.equal(used, matcher, dependency);
  }
  const fromAdapter = createRequire(require.resolve("minimatch"));
  assert.equal(fromAdapter("minimatch-modern/package.json").version, "11.0.4");
});
