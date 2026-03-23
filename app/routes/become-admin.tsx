import { Form, useActionData } from "react-router";
import { PasscodeKind } from "../../generated/prisma/enums";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { requireUser } from "~/lib/guards.server";
import { verifyPasscode } from "~/lib/passcodes.server";
import { prisma } from "~/lib/prisma.server";

type ActionData = {
  error?: string;
  success?: string;
};

export async function action({ request }: { request: Request }) {
  const viewer = await requireUser(request);
  const formData = await request.formData();
  const passcode = String(formData.get("passcode") ?? "");

  if (!passcode) {
    return { error: "Passcode is required." } satisfies ActionData;
  }

  const isValid = await verifyPasscode(PasscodeKind.ADMIN, passcode);
  if (!isValid) {
    return { error: "Invalid passcode." } satisfies ActionData;
  }

  await prisma.user.update({
    where: { id: viewer.userId },
    data: {
      isAdmin: true,
      isMember: true,
    },
  });

  return { success: "Admin role granted." } satisfies ActionData;
}

export default function BecomeAdminRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-md rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Become Admin</h1>
      <p className="mb-3 text-sm text-neutral-600">
        Enter the admin passcode to gain message delete access and passcode management.
      </p>
      <Form className="space-y-3" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="admin-passcode">Admin passcode</FieldLabel>
            <Input id="admin-passcode" name="passcode" required type="password" />
          </Field>
        </FieldGroup>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        {actionData?.success && <p className="text-sm text-green-700">{actionData.success}</p>}
        <FormSubmitButton>Become Admin</FormSubmitButton>
      </Form>
    </main>
  );
}
