import { redirect } from "react-router";
import { auth } from "~/lib/auth.server";

export async function loader({ request }: { request: Request }) {
  await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  throw redirect("/");
}

export default function LogoutRoute() {
  return null;
}
