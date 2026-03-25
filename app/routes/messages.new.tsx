import { redirect } from "react-router";
import { prisma } from "~/lib/prisma.server";
import { requireUser } from "~/lib/guards.server";
import { newMessageSchema, parseFormData } from "~/lib/validation.server";

type ActionData = {
  fieldErrors?: {
    title?: string;
    body?: string;
  };
  formError?: string;
};

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  throw redirect("/");
}

export async function action({ request }: { request: Request }) {
  const viewer = await requireUser(request);
  const formData = await request.formData();
  const parsed = parseFormData(newMessageSchema, formData);
  if ("fieldErrors" in parsed) {
    return {
      fieldErrors: parsed.fieldErrors as ActionData["fieldErrors"],
      formError: parsed.formError,
    } satisfies ActionData;
  }
  const { title, body } = parsed.data;

  await prisma.message.create({
    data: {
      title,
      body,
      authorId: viewer.userId,
    },
  });

  return { success: true } as const;
}
