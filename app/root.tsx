import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { buttonVariants } from "~/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import { getViewerFromRequest } from "~/lib/session.server";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/root";
import "./app.css";

export const meta: Route.MetaFunction = () => [{ title: "Members Only" }];

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon-light.svg",
    media: "(prefers-color-scheme: light)",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon-dark.svg",
    media: "(prefers-color-scheme: dark)",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const viewer = await getViewerFromRequest(request);
  return { viewer };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const viewer = data?.viewer;
  const isAuthenticated = Boolean(viewer);
  const canJoinClub = Boolean(viewer && !viewer.isMember && !viewer.isAdmin);
  const canBecomeAdmin = Boolean(viewer && !viewer.isAdmin);
  const canManagePasscodes = Boolean(viewer?.isAdmin);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="mx-auto min-h-screen w-full max-w-4xl p-4">
          <header className="mb-6 flex items-center justify-between border-b pb-3">
            <Link className="text-lg font-semibold" to="/">
              Members Only
            </Link>
            {!isAuthenticated && (
              <NavigationMenu>
                <NavigationMenuList className="gap-2">
                  <NavigationMenuItem>
                    <Link
                      className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                      to="/sign-up"
                    >
                      Sign Up
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                      to="/login"
                    >
                      Login
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
            {isAuthenticated && (
              <NavigationMenu>
                <NavigationMenuList className="gap-2">
                  {canJoinClub && (
                    <NavigationMenuItem>
                      <Link
                        className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                        to="/join-club"
                      >
                        Join Club
                      </Link>
                    </NavigationMenuItem>
                  )}
                  {canBecomeAdmin && (
                    <NavigationMenuItem>
                      <Link
                        className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                        to="/become-admin"
                      >
                        Become Admin
                      </Link>
                    </NavigationMenuItem>
                  )}
                  {canManagePasscodes && (
                    <NavigationMenuItem>
                      <Link
                        className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                        to="/admin/passcodes"
                      >
                        Admin Passcodes
                      </Link>
                    </NavigationMenuItem>
                  )}
                  <NavigationMenuItem>
                    <Link
                      className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
                      to="/logout"
                    >
                      Logout
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </header>
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
