// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useActionDataMock = vi.fn();
const useNavigationMock = vi.fn();

vi.mock("~/lib/auth.server", () => ({
  auth: {},
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

describe("sign-up route frontend", () => {
  beforeEach(() => {
    useActionDataMock.mockReset();
    useNavigationMock.mockReset();
  });

  it("renders field-level validation errors", async () => {
    useActionDataMock.mockReturnValue({
      fieldErrors: {
        name: "Name is required.",
        email: "Email is required.",
        password: "Password is required.",
        confirmPassword: "Confirm password is required.",
      },
    });
    useNavigationMock.mockReturnValue({ state: "idle" });

    const { default: SignUpRoute } = await import("~/routes/sign-up");
    render(<SignUpRoute />);

    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(screen.getByText("Confirm password is required.")).toBeInTheDocument();
  });

  it("disables submit while submitting", async () => {
    useActionDataMock.mockReturnValue(undefined);
    useNavigationMock.mockReturnValue({ state: "submitting" });

    const { default: SignUpRoute } = await import("~/routes/sign-up");
    render(<SignUpRoute />);

    expect(screen.getByRole("button", { name: /sign up/i })).toBeDisabled();
  });
});
