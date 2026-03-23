import { Form, Link, redirect, useActionData } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Email is required.";
  if (!password) fieldErrors.password = "Password is required.";
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors } satisfies ActionData;
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
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

    let message = "Invalid email or password.";
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
    return { formError: "Invalid email or password." } satisfies ActionData;
  }
}

export default function LoginRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-md rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Login</h1>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input id="login-email" name="email" required type="email" />
            <FieldError>{actionData?.fieldErrors?.email}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input id="login-password" name="password" required type="password" />
            <FieldError>{actionData?.fieldErrors?.password}</FieldError>
          </Field>
        </FieldGroup>
        <FieldError>{actionData?.formError}</FieldError>
        <FormSubmitButton>Log in</FormSubmitButton>
      </Form>
      <p className="mt-3 text-sm">
        No account yet?{" "}
        <Link className="underline" to="/sign-up">
          Sign up
        </Link>
      </p>
    </main>
  );
}
