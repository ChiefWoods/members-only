import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdmin, requireMember, requireUser } from "~/lib/guards.server";
import { getViewerFromRequest } from "~/lib/session.server";

vi.mock("~/lib/session.server", () => ({
  getViewerFromRequest: vi.fn(),
}));

const mockedGetViewer = vi.mocked(getViewerFromRequest);

describe("guards.server", () => {
  beforeEach(() => {
    mockedGetViewer.mockReset();
  });

  it("requireUser returns viewer when authenticated", async () => {
    mockedGetViewer.mockResolvedValue({
      userId: "u1",
      name: "Test User",
      email: "test@example.com",
      isMember: false,
      isAdmin: false,
    });

    const req = new Request("http://localhost/messages/new");
    const viewer = await requireUser(req);

    expect(viewer.userId).toBe("u1");
  });

  it("requireUser throws redirect response when unauthenticated", async () => {
    mockedGetViewer.mockResolvedValue(null);
    const req = new Request("http://localhost/messages/new");

    await expect(requireUser(req)).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });
  });

  it("requireMember allows member or admin", async () => {
    mockedGetViewer.mockResolvedValue({
      userId: "u1",
      name: "Member User",
      email: "member@example.com",
      isMember: true,
      isAdmin: false,
    });

    const req = new Request("http://localhost/join-club");
    await expect(requireMember(req)).resolves.toMatchObject({ userId: "u1" });
  });

  it("requireMember redirects non-member users", async () => {
    mockedGetViewer.mockResolvedValue({
      userId: "u1",
      name: "Plain User",
      email: "plain@example.com",
      isMember: false,
      isAdmin: false,
    });

    const req = new Request("http://localhost/join-club");
    await expect(requireMember(req)).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });
  });

  it("requireAdmin rejects non-admin users with 403", async () => {
    mockedGetViewer.mockResolvedValue({
      userId: "u1",
      name: "Member User",
      email: "member@example.com",
      isMember: true,
      isAdmin: false,
    });

    const req = new Request("http://localhost/admin/passcodes");
    await expect(requireAdmin(req)).rejects.toMatchObject({ status: 403 });
  });
});
