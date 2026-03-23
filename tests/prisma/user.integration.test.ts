import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("prisma user table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("enforces unique user emails", async () => {
    const context = await createTestDb();
    contexts.push(context);

    await context.prisma.user.create({
      data: {
        name: "Primary User",
        email: "unique@example.com",
      },
    });

    await expect(
      context.prisma.user.create({
        data: {
          name: "Duplicate User",
          email: "unique@example.com",
        },
      }),
    ).rejects.toThrow();
  });

  it("stores and updates role flags", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const viewer = await context.prisma.user.create({
      data: {
        name: "Viewer",
        email: "viewer@example.com",
        isMember: false,
        isAdmin: false,
      },
      select: {
        id: true,
        isMember: true,
        isAdmin: true,
      },
    });

    expect(viewer.isMember).toBe(false);
    expect(viewer.isAdmin).toBe(false);

    const updated = await context.prisma.user.update({
      where: { id: viewer.id },
      data: {
        isMember: true,
        isAdmin: true,
      },
      select: {
        isMember: true,
        isAdmin: true,
      },
    });

    expect(updated.isMember).toBe(true);
    expect(updated.isAdmin).toBe(true);
  });
});
