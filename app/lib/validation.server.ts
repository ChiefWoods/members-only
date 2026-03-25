import { z } from "zod";

/** Single-line required string after trim (HTML form fields are always strings). */
const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);

/**
 * Optional form field: missing key or empty input becomes "" after trim.
 * Keeps object output shape stable for downstream refinements.
 */
const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => (value ?? "").trim());

/** HTML form values can include leading/trailing whitespace; trim before `z.email`. */
const trimmedEmailSchema = (message: string) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.email(message));

export const signUpSchema = z
  .object({
    name: requiredTrimmedString("Name is required."),
    email: trimmedEmailSchema("Email is required.").transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm password is required."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: trimmedEmailSchema("Email is required.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required."),
});

export const passcodeEntrySchema = z.object({
  passcode: z.string().min(1, "Passcode is required."),
});

export const newMessageSchema = z.object({
  title: requiredTrimmedString("Title is required."),
  body: requiredTrimmedString("Message body is required."),
});

export const adminPasscodesSchema = z
  .object({
    memberPasscode: optionalTrimmedString,
    adminPasscode: optionalTrimmedString,
  })
  .refine(
    (value) => (value.memberPasscode?.length ?? 0) > 0 || (value.adminPasscode?.length ?? 0) > 0,
    {
      message: "Provide at least one passcode to update.",
      path: [],
    },
  );

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PasscodeEntryFormData = z.infer<typeof passcodeEntrySchema>;
export type NewMessageFormData = z.infer<typeof newMessageSchema>;
export type AdminPasscodesFormData = z.infer<typeof adminPasscodesSchema>;

export type FormValidationSuccess<TSchema extends z.ZodTypeAny> = {
  data: z.infer<TSchema>;
};

export type FormValidationFailure = {
  fieldErrors: Record<string, string>;
  formError?: string;
};

/** Build a plain object from `FormData` for Zod (strings only; skips file inputs). */
function formDataToRecord(formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  return values;
}

/**
 * Map Zod issues to field keys and optional root / form-level message.
 * Uses full `issue.path` (joined) per Zod nested-field guidance.
 * When Zod reports multiple issues for the same path, the first message wins (stable UX copy).
 */
function issuesToFormErrors(
  issues: z.core.$ZodIssue[],
): Pick<FormValidationFailure, "fieldErrors" | "formError"> {
  const fieldErrors: Record<string, string> = {};
  const rootMessages: string[] = [];

  for (const issue of issues) {
    if (issue.path.length === 0) {
      rootMessages.push(issue.message);
      continue;
    }
    const fieldPath = issue.path.map(String).join(".");
    if (fieldErrors[fieldPath] === undefined) {
      fieldErrors[fieldPath] = issue.message;
    }
  }

  return {
    fieldErrors,
    formError: rootMessages.length > 0 ? rootMessages.join(" ") : undefined,
  };
}

export function parseFormData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  formData: FormData,
): FormValidationSuccess<TSchema> | FormValidationFailure {
  const values = formDataToRecord(formData);
  const result = schema.safeParse(values);

  if (result.success) {
    return { data: result.data };
  }

  return issuesToFormErrors(result.error.issues);
}
