import { Form, Link, useActionData } from "react-router";
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
        <label className="block text-sm">
          Full name
          <input className="mt-1 w-full rounded border p-2" name="name" required type="text" />
        </label>
        <label className="block text-sm">
          Email
          <input className="mt-1 w-full rounded border p-2" name="email" required type="email" />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded border p-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="block text-sm">
          Confirm password
          <input
            className="mt-1 w-full rounded border p-2"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
        </label>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        <button className="rounded border px-3 py-2" type="submit">
          Sign up
        </button>
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
