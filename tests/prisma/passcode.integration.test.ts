import { afterEach, describe, expect, it } from "vitest";
import { PasscodeKind } from "../../generated/prisma/enums";
import { hashSecret } from "~/lib/password.server";
import { createTestDb } from "../helpers/db";

describe("prisma passcode table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("allows only one passcode row per kind and supports updates via upsert", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const admin = await context.prisma.user.create({
      data: {
        name: "Admin",
        email: "admin-integration@example.com",
        isMember: true,
        isAdmin: true,
      },
    });

    await context.prisma.passcode.upsert({
      where: { kind: PasscodeKind.MEMBER },
      create: {
        kind: PasscodeKind.MEMBER,
        codeHash: hashSecret("welcome"),
        updatedById: admin.id,
      },
      update: {
        codeHash: hashSecret("welcome"),
        updatedById: admin.id,
      },
    });

    await expect(
      context.prisma.passcode.create({
        data: {
          kind: PasscodeKind.MEMBER,
          codeHash: hashSecret("another"),
          updatedById: admin.id,
        },
      }),
    ).rejects.toThrow();

    await context.prisma.passcode.upsert({
      where: { kind: PasscodeKind.MEMBER },
      create: {
        kind: PasscodeKind.MEMBER,
        codeHash: hashSecret("new-value"),
        updatedById: admin.id,
      },
      update: {
        codeHash: hashSecret("new-value"),
        updatedById: admin.id,
      },
    });

    const passcode = await context.prisma.passcode.findUnique({
      where: { kind: PasscodeKind.MEMBER },
      select: { kind: true, updatedById: true },
    });

    expect(passcode?.kind).toBe(PasscodeKind.MEMBER);
    expect(passcode?.updatedById).toBe(admin.id);
    expect(await context.prisma.passcode.count()).toBe(1);
  });
});
