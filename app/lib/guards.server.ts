import { redirect } from "react-router";
import { getViewerFromRequest } from "./session.server";

function buildRedirectUrl(pathname: string): string {
  const next = encodeURIComponent(pathname);
  return `/login?next=${next}`;
}

export async function requireUser(request: Request) {
  const viewer = await getViewerFromRequest(request);
  if (!viewer) {
    const url = new URL(request.url);
    throw redirect(buildRedirectUrl(url.pathname));
  }
  return viewer;
}

export async function requireMember(request: Request) {
  const viewer = await requireUser(request);
  if (!viewer.isMember && !viewer.isAdmin) {
    throw redirect("/join-club");
  }
  return viewer;
}

export async function requireAdmin(request: Request) {
  const viewer = await requireUser(request);
  if (!viewer.isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }
  return viewer;
}
