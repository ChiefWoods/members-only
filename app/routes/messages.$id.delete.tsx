import { requireAdmin } from "~/lib/guards.server";
import { prisma } from "~/lib/prisma.server";

export async function action({ request, params }: { request: Request; params: { id?: string } }) {
  await requireAdmin(request);
  const id = params.id;

  if (!id) {
    throw new Response("Message id is required", { status: 400 });
  }

  await prisma.message.delete({
    where: { id },
  });

  return { success: true } as const;
}
