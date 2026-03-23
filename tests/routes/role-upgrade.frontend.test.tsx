// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useActionDataMock = vi.fn();

vi.mock("~/lib/guards.server", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("~/lib/prisma.server", () => ({
  prisma: {},
}));

vi.mock("~/lib/passcodes.server", () => ({
  verifyPasscode: vi.fn(),
  setPasscode: vi.fn(),
}));

vi.mock("~/components/countdown-redirect-notice", () => ({
  CountdownRedirectNotice: ({ active, message }: { active: boolean; message: string }) =>
    active ? <p>{message} Redirecting to home in 3 seconds...</p> : null,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    Form: ({ children, ...props }: React.ComponentProps<"form">) => (
      <form {...props}>{children}</form>
    ),
    useActionData: useActionDataMock,
  };
});

describe("role/passcode frontend routes", () => {
  beforeEach(() => {
    useActionDataMock.mockReset();
  });

  it("shows join-club success redirect notice", async () => {
    useActionDataMock.mockReturnValue({
      success: "You are now a club member.",
    });

    const { default: JoinClubRoute } = await import("~/routes/join-club");
    render(<JoinClubRoute />);

    expect(screen.getByText(/You are now a club member\./)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to home in 3 seconds/)).toBeInTheDocument();
  });

  it("shows become-admin form error", async () => {
    useActionDataMock.mockReturnValue({
      formError: "Invalid passcode.",
    });

    const { default: BecomeAdminRoute } = await import("~/routes/become-admin");
    render(<BecomeAdminRoute />);

    expect(screen.getByText("Invalid passcode.")).toBeInTheDocument();
  });

  it("shows admin-passcodes success redirect notice", async () => {
    useActionDataMock.mockReturnValue({
      success: "Passcodes updated.",
    });

    const { default: AdminPasscodesRoute } = await import("~/routes/admin.passcodes");
    render(<AdminPasscodesRoute />);

    expect(screen.getByText(/Passcodes updated\./)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to home in 3 seconds/)).toBeInTheDocument();
  });
});
