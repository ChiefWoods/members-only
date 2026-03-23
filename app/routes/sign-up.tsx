import { Form, Link, redirect, useActionData } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  if (!password) fieldErrors.password = "Password is required.";
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirm password is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors } satisfies ActionData;
  }
  if (password !== confirmPassword) {
    return { fieldErrors: { confirmPassword: "Passwords do not match." } } satisfies ActionData;
  }
  if (password.length < 8) {
    return {
      fieldErrors: { password: "Password must be at least 8 characters." },
    } satisfies ActionData;
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      asResponse: true,
    });

    if (response.ok) {
      const headers = new Headers();
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        headers.append("set-cookie", setCookie);
      }
      return redirect("/", { headers });
    }

    let message = "Unable to sign up. Try a different email.";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // Keep default message if response body is not JSON.
    }
    return { formError: message } satisfies ActionData;
  } catch {
    return { formError: "Unable to sign up. Try a different email." } satisfies ActionData;
  }
}

export default function SignUpRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-md rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Create account</h1>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signup-name">Name</FieldLabel>
            <Input id="signup-name" name="name" required type="text" />
            <FieldError>{actionData?.fieldErrors?.name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input id="signup-email" name="email" required type="email" />
            <FieldError>{actionData?.fieldErrors?.email}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Input id="signup-password" minLength={8} name="password" required type="password" />
            <FieldError>{actionData?.fieldErrors?.password}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-confirm-password">Confirm password</FieldLabel>
            <Input
              id="signup-confirm-password"
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
            <FieldError>{actionData?.fieldErrors?.confirmPassword}</FieldError>
          </Field>
        </FieldGroup>
        <FieldError>{actionData?.formError}</FieldError>
        <FormSubmitButton>Sign up</FormSubmitButton>
      </Form>
      <p className="mt-3 text-sm">
        Already have an account?{" "}
        <Link className="underline" to="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
