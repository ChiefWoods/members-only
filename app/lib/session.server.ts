import { auth } from "./auth.server";
import { prisma } from "./prisma.server";

export type ViewerSession = {
  userId: string;
  name: string;
  email: string;
  isMember: boolean;
  isAdmin: boolean;
};

type BetterAuthSession = {
  user?: {
    id?: string;
  };
};

export async function getViewerFromRequest(request: Request): Promise<ViewerSession | null> {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as BetterAuthSession | null;

  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isMember: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    isMember: user.isMember,
    isAdmin: user.isAdmin,
  };
}
