import { redirect } from "react-router";
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
  throw redirect("/");
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

  return { success: true } as const;
}
