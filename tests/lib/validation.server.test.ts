import { describe, expect, it } from "vitest";
import {
  adminPasscodesSchema,
  loginSchema,
  newMessageSchema,
  parseFormData,
  passcodeEntrySchema,
  signUpSchema,
} from "~/lib/validation.server";

function toFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("validation schemas", () => {
  it("returns missing field errors for sign-up", () => {
    const result = parseFormData(
      signUpSchema,
      toFormData({ name: "", email: "", password: "", confirmPassword: "" }),
    );
    expect("fieldErrors" in result).toBe(true);
    if ("fieldErrors" in result) {
      expect(result.fieldErrors.name).toBe("Name is required.");
      expect(result.fieldErrors.email).toBe("Email is required.");
      expect(result.fieldErrors.password).toBe("Password is required.");
      expect(result.fieldErrors.confirmPassword).toBe("Confirm password is required.");
    }
  });

  it("trims email before validation", () => {
    const result = parseFormData(
      loginSchema,
      toFormData({ email: "  Test@Example.com  ", password: "password123" }),
    );
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("returns invalid email error for login", () => {
    const result = parseFormData(
      loginSchema,
      toFormData({ email: "invalid", password: "password123" }),
    );
    expect("fieldErrors" in result).toBe(true);
    if ("fieldErrors" in result) {
      expect(result.fieldErrors.email).toBe("Email is required.");
    }
  });

  it("returns short password error for sign-up", () => {
    const result = parseFormData(
      signUpSchema,
      toFormData({
        name: "Example",
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
      }),
    );
    expect("fieldErrors" in result).toBe(true);
    if ("fieldErrors" in result) {
      expect(result.fieldErrors.password).toBe("Password must be at least 8 characters.");
    }
  });

  it("returns confirm-password mismatch error", () => {
    const result = parseFormData(
      signUpSchema,
      toFormData({
        name: "Example",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password124",
      }),
    );
    expect("fieldErrors" in result).toBe(true);
    if ("fieldErrors" in result) {
      expect(result.fieldErrors.confirmPassword).toBe("Passwords do not match.");
    }
  });

  it("returns empty passcodes form error", () => {
    const result = parseFormData(
      adminPasscodesSchema,
      toFormData({ memberPasscode: "", adminPasscode: "" }),
    );
    expect("fieldErrors" in result).toBe(true);
    if ("fieldErrors" in result) {
      expect(result.formError).toBe("Provide at least one passcode to update.");
    }
  });

  it("accepts valid message and passcode payloads", () => {
    const messageResult = parseFormData(
      newMessageSchema,
      toFormData({ title: "Hello", body: "World" }),
    );
    expect("data" in messageResult).toBe(true);

    const passcodeResult = parseFormData(passcodeEntrySchema, toFormData({ passcode: "secret" }));
    expect("data" in passcodeResult).toBe(true);
  });
});
