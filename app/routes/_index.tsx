import { Form, Link, useLoaderData } from "react-router";
import { prisma } from "~/lib/prisma.server";
import { getViewerFromRequest } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  const viewer = await getViewerFromRequest(request);
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    viewer,
    canSeeMetadata: Boolean(viewer?.isMember || viewer?.isAdmin),
    canDelete: Boolean(viewer?.isAdmin),
    messages: messages.map((message) => ({
      id: message.id,
      title: message.title,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      authorName: message.author.name,
    })),
  };
}

export default function HomeRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="space-y-4">
      <section className="rounded border p-4">
        <h1 className="text-xl font-semibold">Message Board</h1>
        <p className="text-sm text-neutral-600">
          Everyone sees messages. Members can also see authors and timestamps.
        </p>
        {data.viewer && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span>
              Signed in as <strong>{data.viewer.name}</strong>
            </span>
            <Link className="underline" to="/logout">
              Logout
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        {data.messages.length === 0 && (
          <p className="rounded border p-4 text-sm">No messages yet.</p>
        )}

        {data.messages.map((message) => (
          <article className="rounded border p-4" key={message.id}>
            <h2 className="font-semibold">{message.title}</h2>
            <p className="mt-2 whitespace-pre-wrap">{message.body}</p>

            {data.canSeeMetadata && (
              <p className="mt-3 text-xs text-neutral-500">
                By {message.authorName} on {new Date(message.createdAt).toLocaleString()}
              </p>
            )}

            {data.canDelete && (
              <Form action={`/messages/${message.id}/delete`} method="post">
                <button
                  className="mt-2 cursor-pointer text-sm text-red-600 underline"
                  type="submit"
                >
                  Delete
                </button>
              </Form>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
