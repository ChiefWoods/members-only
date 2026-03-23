import { Form, redirect, useActionData } from "react-router";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { prisma } from "~/lib/prisma.server";
import { requireUser } from "~/lib/guards.server";

type ActionData = {
  fieldErrors?: {
    title?: string;
    body?: string;
  };
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

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (!body) fieldErrors.body = "Message body is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors } satisfies ActionData;
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
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="message-title">Title</FieldLabel>
            <Input id="message-title" maxLength={120} name="title" required type="text" />
            <FieldError>{actionData?.fieldErrors?.title}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="message-body">Message</FieldLabel>
            <Textarea id="message-body" name="body" required />
            <FieldError>{actionData?.fieldErrors?.body}</FieldError>
          </Field>
        </FieldGroup>
        <FormSubmitButton>Publish</FormSubmitButton>
      </Form>
    </main>
  );
}
