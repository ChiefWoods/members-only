import { Form, Link, useActionData } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
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
        <label className="block text-sm">
          Email
          <input className="mt-1 w-full rounded border p-2" name="email" required type="email" />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded border p-2"
            name="password"
            required
            type="password"
          />
        </label>
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
