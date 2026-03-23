import { Form, useActionData } from "react-router";
import { PasscodeKind } from "../../generated/prisma/enums";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { requireAdmin } from "~/lib/guards.server";
import { setPasscode } from "~/lib/passcodes.server";

type ActionData = {
  fieldErrors?: {
    memberPasscode?: string;
    adminPasscode?: string;
  };
  formError?: string;
  success?: string;
};

export async function loader({ request }: { request: Request }) {
  await requireAdmin(request);
  return null;
}

export async function action({ request }: { request: Request }) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const memberPasscode = String(formData.get("memberPasscode") ?? "").trim();
  const adminPasscode = String(formData.get("adminPasscode") ?? "").trim();

  if (!memberPasscode && !adminPasscode) {
    return {
      formError: "Provide at least one passcode to update.",
    } satisfies ActionData;
  }

  if (memberPasscode) {
    await setPasscode({
      kind: PasscodeKind.MEMBER,
      rawCode: memberPasscode,
      updatedById: admin.userId,
    });
  }

  if (adminPasscode) {
    await setPasscode({
      kind: PasscodeKind.ADMIN,
      rawCode: adminPasscode,
      updatedById: admin.userId,
    });
  }

  return { success: "Passcodes updated." } satisfies ActionData;
}

export default function AdminPasscodesRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-lg rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Admin Passcodes</h1>
      <p className="mb-3 text-sm text-neutral-600">
        Update the member/admin passcodes. Leave a field blank to keep it unchanged.
      </p>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="member-passcode">New member passcode</FieldLabel>
            <Input id="member-passcode" name="memberPasscode" type="password" />
            <FieldError>{actionData?.fieldErrors?.memberPasscode}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="admin-passcode">New admin passcode</FieldLabel>
            <Input id="admin-passcode" name="adminPasscode" type="password" />
            <FieldError>{actionData?.fieldErrors?.adminPasscode}</FieldError>
          </Field>
        </FieldGroup>
        <FieldError>{actionData?.formError}</FieldError>
        {actionData?.success && <p className="text-sm text-green-700">{actionData.success}</p>}
        <FormSubmitButton>Save passcodes</FormSubmitButton>
      </Form>
    </main>
  );
}
