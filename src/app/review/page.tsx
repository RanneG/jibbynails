import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export const metadata = {
  title: "Leave a review — Jibbynails",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sent = first(raw.sent);
  const err = first(raw.err);
  const visit = first(raw.visit);

  if (sent === "private") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="font-heading text-[2.8rem] leading-none">Sent to Jibby</h1>
          <p className="mt-3 max-w-sm text-sm tracking-wide text-muted-foreground">
            Notes under 5 stars stay private. They don’t appear on the site.
          </p>
          <Link href="/" className="btn-gold mt-8 px-8">
            Home
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8 pt-8">
        <p className="eyebrow">After your set</p>
        <h1 className="font-heading mt-2 text-[2.8rem] leading-none">Leave a review</h1>
        <p className="mt-3 text-sm tracking-wide text-muted-foreground">
          5 stars go on the site. Anything less is sent privately to Jibby.
        </p>
        {err === "details" ? (
          <p className="mt-4 text-sm text-destructive">Add your name, a short note, and a star rating.</p>
        ) : null}
        {err === "photo" ? (
          <p className="mt-4 text-sm text-destructive">Photo must be a JPG, PNG or WebP under 4MB.</p>
        ) : null}

        <form action="/api/reviews" method="post" encType="multipart/form-data" className="mt-8 space-y-5">
          {visit ? <input type="hidden" name="visit" value={visit} /> : null}
          <fieldset>
            <legend className="text-sm">Stars</legend>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    defaultChecked={n === 5}
                    className="peer sr-only"
                    required
                  />
                  <span className="text-3xl leading-none text-ink/20 peer-checked:text-ink">★</span>
                  <span className="sr-only">
                    {n} star{n === 1 ? "" : "s"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm">
            Name
            <input
              name="name"
              required
              minLength={2}
              autoComplete="name"
              className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4"
            />
          </label>
          <label className="block text-sm">
            How was the set?
            <textarea
              name="text"
              required
              minLength={8}
              rows={4}
              className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-3"
              placeholder="Gel-X medium, fruit art."
            />
          </label>
          <label className="block text-sm">
            Photo <span className="text-muted-foreground">(optional)</span>
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1.5 block w-full text-sm"
            />
          </label>
          <button type="submit" className="btn-gold w-full">
            Post
          </button>
          <Link href="/reviews" className="block text-center text-sm text-muted-foreground">
            Not now
          </Link>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
