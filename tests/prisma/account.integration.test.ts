import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("prisma account table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("enforces unique provider/account pair", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const user = await context.prisma.user.create({
      data: {
        name: "Account User",
        email: "account-user@example.com",
      },
    });

    await context.prisma.account.create({
      data: {
        userId: user.id,
        providerId: "email",
        accountId: "account-1",
      },
    });

    await expect(
      context.prisma.account.create({
        data: {
          userId: user.id,
          providerId: "email",
          accountId: "account-1",
        },
      }),
    ).rejects.toThrow();
  });
});
