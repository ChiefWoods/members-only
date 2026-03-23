import { Form, Link, useActionData } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";

type ActionData = {
  error?: string;
};

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required." } satisfies ActionData;
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." } satisfies ActionData;
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." } satisfies ActionData;
  }

  return auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
    asResponse: true,
  });
}

export default function SignUpRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-md rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Create account</h1>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
            <Input id="signup-name" name="name" required type="text" />
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input id="signup-email" name="email" required type="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Input id="signup-password" minLength={8} name="password" required type="password" />
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
          </Field>
        </FieldGroup>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
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
