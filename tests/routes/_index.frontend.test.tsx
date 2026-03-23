// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

const useLoaderDataMock = vi.fn();
const useFetcherMock = vi.fn();

vi.mock("~/lib/prisma.server", () => ({
  prisma: {},
}));

vi.mock("~/lib/session.server", () => ({
  getViewerFromRequest: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    Link: ({ children, to, ...props }: React.ComponentProps<"a"> & { to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useLoaderData: useLoaderDataMock,
    useFetcher: useFetcherMock,
  };
});

describe("home route frontend", () => {
  beforeEach(() => {
    useLoaderDataMock.mockReset();
    useFetcherMock.mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("shows signed-in summary and delete icon for admins", async () => {
    useLoaderDataMock.mockReturnValue({
      viewer: { name: "Chii", isMember: true, isAdmin: true },
      canSeeMetadata: true,
      canDelete: true,
      messages: [
        {
          id: "m1",
          title: "First message",
          body: "hello there",
          createdAt: new Date().toISOString(),
          authorName: "Chii",
        },
      ],
    });
    useFetcherMock
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: undefined,
        state: "idle",
      })
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: undefined,
        state: "idle",
      });

    const { default: HomeRoute } = await import("~/routes/_index");
    render(<HomeRoute />);

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete message" })).toBeInTheDocument();
    expect(screen.getByText(/^By Chii on/)).toBeInTheDocument();
  });

  it("triggers a toast when delete action succeeds", async () => {
    const mockedToastSuccess = vi.mocked(toast.success);

    useLoaderDataMock.mockReturnValue({
      viewer: { name: "Chii", isMember: true, isAdmin: true },
      canSeeMetadata: true,
      canDelete: true,
      messages: [],
    });
    useFetcherMock
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: undefined,
        state: "idle",
      })
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: { success: true },
        state: "idle",
      });

    const { default: HomeRoute } = await import("~/routes/_index");
    render(<HomeRoute />);

    expect(mockedToastSuccess).toHaveBeenCalledWith("Message deleted.");
  });

  it("hides admin-only controls for non-admin viewers", async () => {
    useLoaderDataMock.mockReturnValue({
      viewer: { name: "Member", isMember: true, isAdmin: false },
      canSeeMetadata: true,
      canDelete: false,
      messages: [
        {
          id: "m1",
          title: "First message",
          body: "hello there",
          createdAt: new Date().toISOString(),
          authorName: "Chii",
        },
      ],
    });
    useFetcherMock
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: undefined,
        state: "idle",
      })
      .mockReturnValueOnce({
        Form: ({ children, ...props }: React.ComponentProps<"form">) => (
          <form {...props}>{children}</form>
        ),
        data: undefined,
        state: "idle",
      });

    const { default: HomeRoute } = await import("~/routes/_index");
    render(<HomeRoute />);

    expect(screen.queryByRole("button", { name: "Delete message" })).not.toBeInTheDocument();
  });
});
