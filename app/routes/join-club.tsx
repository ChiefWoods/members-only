import { Form, useActionData } from "react-router";
import { PasscodeKind } from "../../generated/prisma/enums";
import { CountdownRedirectNotice } from "~/components/countdown-redirect-notice";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { verifyPasscode } from "~/lib/passcodes.server";
import { prisma } from "~/lib/prisma.server";
import { requireUser } from "~/lib/guards.server";
import { parseFormData, passcodeEntrySchema } from "~/lib/validation.server";

type ActionData = {
  fieldErrors?: {
    passcode?: string;
  };
  formError?: string;
  success?: string;
};

export async function action({ request }: { request: Request }) {
  const viewer = await requireUser(request);
  const formData = await request.formData();
  const parsed = parseFormData(passcodeEntrySchema, formData);
  if ("fieldErrors" in parsed) {
    return {
      fieldErrors: parsed.fieldErrors as ActionData["fieldErrors"],
      formError: parsed.formError,
    } satisfies ActionData;
  }
  const { passcode } = parsed.data;

  const isValid = await verifyPasscode(PasscodeKind.MEMBER, passcode);
  if (!isValid) {
    return { formError: "Invalid passcode." } satisfies ActionData;
  }

  await prisma.user.update({
    where: { id: viewer.userId },
    data: { isMember: true },
  });

  return { success: "You are now a club member." } satisfies ActionData;
}

export default function JoinClubRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-md rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Join the Club</h1>
      <p className="mb-3 text-sm text-neutral-600">
        Enter the member passcode to reveal author and date metadata.
      </p>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="member-passcode">Member passcode</FieldLabel>
            <Input id="member-passcode" name="passcode" required type="password" />
            <FieldError>{actionData?.fieldErrors?.passcode}</FieldError>
          </Field>
        </FieldGroup>
        <FieldError>{actionData?.formError}</FieldError>
        <CountdownRedirectNotice
          active={Boolean(actionData?.success)}
          message={actionData?.success ?? ""}
        />
        <FormSubmitButton>Join</FormSubmitButton>
      </Form>
    </main>
  );
}
