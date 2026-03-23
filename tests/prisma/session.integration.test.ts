import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("prisma session table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("enforces unique session token", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const user = await context.prisma.user.create({
      data: {
        name: "Session User",
        email: "session-user@example.com",
      },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await context.prisma.session.create({
      data: {
        userId: user.id,
        token: "token-1",
        expiresAt,
      },
    });

    await expect(
      context.prisma.session.create({
        data: {
          userId: user.id,
          token: "token-1",
          expiresAt,
        },
      }),
    ).rejects.toThrow();
  });
});
