import { Form, useActionData } from "react-router";
import { PasscodeKind } from "../../generated/prisma/enums";
import { requireAdmin } from "~/lib/guards.server";
import { setPasscode } from "~/lib/passcodes.server";

type ActionData = {
  error?: string;
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
      error: "Provide at least one passcode to update.",
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
        <label className="block text-sm">
          New member passcode
          <input className="mt-1 w-full rounded border p-2" name="memberPasscode" type="password" />
        </label>
        <label className="block text-sm">
          New admin passcode
          <input className="mt-1 w-full rounded border p-2" name="adminPasscode" type="password" />
        </label>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        {actionData?.success && <p className="text-sm text-green-700">{actionData.success}</p>}
        <button className="rounded border px-3 py-2" type="submit">
          Save passcodes
        </button>
      </Form>
    </main>
  );
}
