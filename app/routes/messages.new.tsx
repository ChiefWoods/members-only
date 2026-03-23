import { Form, redirect, useActionData } from "react-router";
import { prisma } from "~/lib/prisma.server";
import { requireUser } from "~/lib/guards.server";

type ActionData = {
  error?: string;
};

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  return null;
}

export async function action({ request }: { request: Request }) {
  const viewer = await requireUser(request);
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    return { error: "Title and message body are required." } satisfies ActionData;
  }

  await prisma.message.create({
    data: {
      title,
      body,
      authorId: viewer.userId,
    },
  });

  return redirect("/");
}

export default function NewMessageRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="mx-auto max-w-lg rounded border p-4">
      <h1 className="mb-3 text-xl font-semibold">Create a New Message</h1>
      <Form className="space-y-3" method="post">
        <label className="block text-sm">
          Title
          <input
            className="mt-1 w-full rounded border p-2"
            maxLength={120}
            name="title"
            required
            type="text"
          />
        </label>
        <label className="block text-sm">
          Message
          <textarea className="mt-1 min-h-40 w-full rounded border p-2" name="body" required />
        </label>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        <button className="rounded border px-3 py-2" type="submit">
          Publish
        </button>
      </Form>
    </main>
  );
}
