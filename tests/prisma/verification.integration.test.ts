import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("prisma verification table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("enforces unique identifier/value pair", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await context.prisma.verification.create({
      data: {
        identifier: "verify-email@example.com",
        value: "code-1234",
        expiresAt,
      },
    });

    await expect(
      context.prisma.verification.create({
        data: {
          identifier: "verify-email@example.com",
          value: "code-1234",
          expiresAt,
        },
      }),
    ).rejects.toThrow();
  });
});
