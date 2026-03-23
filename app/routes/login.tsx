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
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." } satisfies ActionData;
  }

  return auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
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
          </Field>
          <Field>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input id="login-password" name="password" required type="password" />
          </Field>
        </FieldGroup>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
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
