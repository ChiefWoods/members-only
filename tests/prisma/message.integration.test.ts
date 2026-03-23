import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("prisma message table integration", () => {
  const contexts: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

  afterEach(async () => {
    while (contexts.length > 0) {
      const context = contexts.pop();
      if (context) {
        await context.close();
      }
    }
  });

  it("deletes messages when author is deleted (cascade)", async () => {
    const context = await createTestDb();
    contexts.push(context);

    const user = await context.prisma.user.create({
      data: {
        name: "Author",
        email: "author@example.com",
      },
    });

    await context.prisma.message.create({
      data: {
        title: "Cascade check",
        body: "Should be removed with author.",
        authorId: user.id,
      },
    });

    expect(await context.prisma.message.count()).toBe(1);

    await context.prisma.user.delete({ where: { id: user.id } });

    expect(await context.prisma.message.count()).toBe(0);
  });
});
