import { beforeEach, describe, expect, it, vi } from "vitest";

import { action } from "~/routes/messages.$id.delete";
import { requireAdmin } from "~/lib/guards.server";
import { prisma } from "~/lib/prisma.server";

vi.mock("~/lib/guards.server", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("~/lib/prisma.server", () => ({
  prisma: {
    message: {
      delete: vi.fn(),
    },
  },
}));

const mockedRequireAdmin = vi.mocked(requireAdmin);
const mockedPrisma = vi.mocked(prisma);

describe("messages.$id.delete action", () => {
  beforeEach(() => {
    mockedRequireAdmin.mockReset();
    mockedPrisma.message.delete.mockReset();
  });

  it("requires admin before deleting", async () => {
    mockedRequireAdmin.mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      email: "admin@example.com",
      isMember: true,
      isAdmin: true,
    });
    mockedPrisma.message.delete.mockResolvedValue({ id: "m1" } as never);

    const req = new Request("http://localhost/messages/m1/delete", { method: "POST" });
    const response = await action({ request: req, params: { id: "m1" } });

    expect(mockedRequireAdmin).toHaveBeenCalledWith(req);
    expect(mockedPrisma.message.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  it("throws 400 when id param missing", async () => {
    mockedRequireAdmin.mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      email: "admin@example.com",
      isMember: true,
      isAdmin: true,
    });

    const req = new Request("http://localhost/messages/delete", { method: "POST" });
    await expect(action({ request: req, params: {} })).rejects.toMatchObject({ status: 400 });
    expect(mockedPrisma.message.delete).not.toHaveBeenCalled();
  });
});
