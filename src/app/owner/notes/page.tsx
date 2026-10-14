import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/owner";
import { listPrivateFeedback } from "@/lib/server-store";

export const metadata = {
  title: "Private notes — Manager",
};

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  await requireOwner();
  const notes = await listPrivateFeedback();

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8 lg:max-w-3xl">
      <Link href="/owner" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Today
      </Link>
      <h1 className="font-heading mt-4 text-[2.8rem] leading-none">Private notes</h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground">
        Reviews under five stars come here instead of the site. Only you see them.
      </p>

      {notes.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No private notes yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="surface overflow-hidden rounded-3xl p-4">
              <p className="text-sm tracking-wide">
                {"★".repeat(note.rating)}
                <span className="text-ink/20">{"★".repeat(5 - note.rating)}</span>
                <span className="ml-2 text-xs text-muted-foreground">{note.name}</span>
              </p>
              <p className="mt-3 text-sm leading-6">{note.text}</p>
              {note.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={note.photoUrl} alt="" className="mt-3 max-h-56 w-full rounded-2xl object-cover" />
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {note.visitId ? (
                  <>
                    {" · "}
                    <Link href={`/owner/booking/${note.visitId}`} className="underline underline-offset-4">
                      their booking
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
