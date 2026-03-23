import { beforeEach, describe, expect, it, vi } from "vitest";

import { PasscodeKind } from "../../generated/prisma/enums";
import { setPasscode, verifyPasscode } from "~/lib/passcodes.server";
import { hashSecret, safeEqualText, verifySecret } from "~/lib/password.server";
import { prisma } from "~/lib/prisma.server";

vi.mock("~/lib/prisma.server", () => ({
  prisma: {
    passcode: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("~/lib/password.server", () => ({
  hashSecret: vi.fn(),
  verifySecret: vi.fn(),
  safeEqualText: vi.fn(),
}));

const mockedPrisma = vi.mocked(prisma);
const mockedHashSecret = vi.mocked(hashSecret);
const mockedVerifySecret = vi.mocked(verifySecret);
const mockedSafeEqualText = vi.mocked(safeEqualText);

describe("passcodes.server", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    mockedPrisma.passcode.findUnique.mockReset();
    mockedPrisma.passcode.upsert.mockReset();
    mockedHashSecret.mockReset();
    mockedVerifySecret.mockReset();
    mockedSafeEqualText.mockReset();
  });

  it("verifyPasscode uses stored hash when present", async () => {
    mockedPrisma.passcode.findUnique.mockResolvedValue({ codeHash: "stored-hash" } as never);
    mockedVerifySecret.mockReturnValue(true);

    const result = await verifyPasscode(PasscodeKind.MEMBER, "candidate");

    expect(result).toBe(true);
    expect(mockedVerifySecret).toHaveBeenCalledWith("candidate", "stored-hash");
  });

  it("verifyPasscode falls back to env passcode when DB row missing", async () => {
    mockedPrisma.passcode.findUnique.mockResolvedValue(null);
    process.env.MEMBER_PASSCODE = "fallback-member";
    mockedSafeEqualText.mockReturnValue(true);

    const result = await verifyPasscode(PasscodeKind.MEMBER, "candidate");

    expect(result).toBe(true);
    expect(mockedSafeEqualText).toHaveBeenCalledWith("candidate", "fallback-member");
  });

  it("verifyPasscode returns false when no DB and no env passcode", async () => {
    mockedPrisma.passcode.findUnique.mockResolvedValue(null);
    delete process.env.ADMIN_PASSCODE;

    const result = await verifyPasscode(PasscodeKind.ADMIN, "candidate");
    expect(result).toBe(false);
  });

  it("setPasscode upserts hashed passcode", async () => {
    mockedHashSecret.mockReturnValue("hashed-value");

    await setPasscode({
      kind: PasscodeKind.ADMIN,
      rawCode: "new-admin",
      updatedById: "user-1",
    });

    expect(mockedPrisma.passcode.upsert).toHaveBeenCalledWith({
      where: { kind: PasscodeKind.ADMIN },
      create: {
        kind: PasscodeKind.ADMIN,
        codeHash: "hashed-value",
        updatedById: "user-1",
      },
      update: {
        codeHash: "hashed-value",
        updatedById: "user-1",
      },
    });
  });
});
