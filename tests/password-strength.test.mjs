import assert from "node:assert/strict";
import { test } from "node:test";
const { passwordError, isWeakPassword } = await import("../src/lib/auth/password.ts");

test("common, sequential and username-based passwords are rejected", () => {
  for (const weak of ["password", "Password1!", "12345678", "87654321", "abcdefgh", "abcd1234", "aaaaaaaa", "qwertyuiop", "Juventus2010", "senigallia!"]) {
    assert.equal(isWeakPassword(weak), true, weak);
  }
  assert.equal(passwordError("marco.rossi99", "marco.rossi"), "passwordCommon");
  assert.equal(passwordError("corto"), "passwordShort");
});

test("ordinary passphrases are accepted", () => {
  for (const ok of ["gatto-blu-salta", "Lampione7Verde", "mare e montagna 3", "zt9!kq2wLp"]) {
    assert.equal(passwordError(ok, "marco.rossi"), null, ok);
  }
});
