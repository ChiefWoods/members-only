// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useActionDataMock = vi.fn();
const useNavigationMock = vi.fn();

vi.mock("~/lib/auth.server", () => ({
  auth: {},
}));

vi.mock("~/lib/prisma.server", () => ({
  prisma: {},
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
    Form: ({ children, ...props }: React.ComponentProps<"form">) => (
      <form {...props}>{children}</form>
    ),
    useActionData: useActionDataMock,
    useNavigation: useNavigationMock,
  };
});

describe("login route frontend", () => {
  it("renders field and form errors", async () => {
    useActionDataMock.mockReturnValue({
      fieldErrors: {
        email: "Email is required.",
        password: "Password is required.",
      },
      formError: "No account exists for this email. Please sign up first.",
    });
    useNavigationMock.mockReturnValue({ state: "idle" });

    const { default: LoginRoute } = await import("~/routes/login");
    render(<LoginRoute />);

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(
      screen.getByText("No account exists for this email. Please sign up first."),
    ).toBeInTheDocument();
  });

  it("disables submit button while submitting", async () => {
    useActionDataMock.mockReturnValue(undefined);
    useNavigationMock.mockReturnValue({ state: "submitting" });

    const { default: LoginRoute } = await import("~/routes/login");
    render(<LoginRoute />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();
  });
});
