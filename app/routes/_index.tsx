import { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-submit-button";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
  const [isNewMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const fetcher = useFetcher<{
    fieldErrors?: { title?: string; body?: string };
    success?: boolean;
  }>();
  const deleteFetcher = useFetcher<{ success?: boolean }>();

  useEffect(() => {
    if (fetcher.data?.success) {
      setNewMessageDialogOpen(false);
    }
  }, [fetcher.data?.success]);

  useEffect(() => {
    if (deleteFetcher.data?.success) {
      toast.success("Message deleted.");
    }
  }, [deleteFetcher.data?.success]);

  return (
    <main className="space-y-4">
      <section className="rounded border p-4">
        <h1 className="text-xl font-semibold">Message Board</h1>
        <p className="text-sm text-neutral-600">
          Everyone sees messages. Members can also see authors and timestamps.
        </p>
        {data.viewer && (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span>
              Signed in as <strong>{data.viewer.name}</strong>
            </span>
            <button
              className="cursor-pointer text-sm underline"
              onClick={() => setNewMessageDialogOpen(true)}
              type="button"
            >
              New Message
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        {data.messages.length === 0 && (
          <p className="rounded border p-4 text-sm">No messages yet.</p>
        )}

        {data.messages.map((message) => (
          <article className="relative rounded border p-4" key={message.id}>
            {data.canDelete && (
              <deleteFetcher.Form
                action={`/messages/${message.id}/delete`}
                className="absolute top-3 right-3"
                method="post"
              >
                <Button
                  aria-label="Delete message"
                  className="cursor-pointer text-red-600 hover:text-red-700"
                  disabled={deleteFetcher.state === "submitting"}
                  size="icon-sm"
                  type="submit"
                  variant="ghost"
                >
                  <Trash2Icon />
                </Button>
              </deleteFetcher.Form>
            )}
            <h2 className="font-semibold">{message.title}</h2>
            <p className="mt-2 whitespace-pre-wrap">{message.body}</p>

            {data.canSeeMetadata && (
              <p className="mt-3 text-xs text-neutral-500">
                By {message.authorName} on {new Date(message.createdAt).toLocaleString()}
              </p>
            )}
          </article>
        ))}
      </section>

      <Dialog onOpenChange={setNewMessageDialogOpen} open={isNewMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Message</DialogTitle>
            <DialogDescription>Share a short message with the clubhouse feed.</DialogDescription>
          </DialogHeader>

          {!data.viewer && (
            <p className="text-sm">
              You need to{" "}
              <Link className="underline" to="/login">
                log in
              </Link>{" "}
              to create a message.
            </p>
          )}

          {data.viewer && (
            <fetcher.Form action="/messages/new" className="space-y-3" method="post">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="message-title">Title</FieldLabel>
                  <Input id="message-title" maxLength={120} name="title" required type="text" />
                  <FieldError>{fetcher.data?.fieldErrors?.title}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="message-body">Message</FieldLabel>
                  <Textarea id="message-body" name="body" required />
                  <FieldError>{fetcher.data?.fieldErrors?.body}</FieldError>
                </Field>
              </FieldGroup>
              <FormSubmitButton isSubmitting={fetcher.state === "submitting"}>
                Publish
              </FormSubmitButton>
            </fetcher.Form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
