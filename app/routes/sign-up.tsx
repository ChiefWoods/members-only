import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";
import { parseFormData, signUpSchema } from "~/lib/validation.server";

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
  const parsed = parseFormData(signUpSchema, formData);
  if ("fieldErrors" in parsed) {
    return {
      fieldErrors: parsed.fieldErrors as ActionData["fieldErrors"],
      formError: parsed.formError,
    } satisfies ActionData;
  }
  const { name, email, password } = parsed.data;

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
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
        <FormSubmitButton isSubmitting={isSubmitting}>Sign up</FormSubmitButton>
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
