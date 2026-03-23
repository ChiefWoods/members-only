import { Form, useActionData } from "react-router";
import { PasscodeKind } from "../../generated/prisma/enums";
import { FormSubmitButton } from "~/components/form-submit-button";
import { verifyPasscode } from "~/lib/passcodes.server";
import { prisma } from "~/lib/prisma.server";
import { requireUser } from "~/lib/guards.server";

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

  const isValid = await verifyPasscode(PasscodeKind.MEMBER, passcode);
  if (!isValid) {
    return { error: "Invalid passcode." } satisfies ActionData;
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
        <label className="block text-sm">
          Member passcode
          <input
            className="mt-1 w-full rounded border p-2"
            name="passcode"
            required
            type="password"
          />
        </label>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        {actionData?.success && <p className="text-sm text-green-700">{actionData.success}</p>}
        <FormSubmitButton>Join</FormSubmitButton>
      </Form>
    </main>
  );
}
