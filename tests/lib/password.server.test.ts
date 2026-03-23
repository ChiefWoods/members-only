import { describe, expect, it } from "vitest";

import { hashSecret, safeEqualText, verifySecret } from "~/lib/password.server";

describe("password.server", () => {
  it("hashSecret + verifySecret succeed with matching secret", () => {
    const raw = "member-secret-123";
    const hash = hashSecret(raw);

    expect(hash).toContain(":");
    expect(verifySecret(raw, hash)).toBe(true);
  });

  it("verifySecret fails with non-matching secret", () => {
    const hash = hashSecret("admin-secret-123");
    expect(verifySecret("wrong-secret", hash)).toBe(false);
  });

  it("verifySecret fails for malformed hashes", () => {
    expect(verifySecret("x", "")).toBe(false);
    expect(verifySecret("x", "missing-separator")).toBe(false);
  });

  it("safeEqualText compares exact strings only", () => {
    expect(safeEqualText("abc", "abc")).toBe(true);
    expect(safeEqualText("abc", "abd")).toBe(false);
    expect(safeEqualText("abc", "abcd")).toBe(false);
  });
});
