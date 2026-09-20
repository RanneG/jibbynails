"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import { useStore } from "@/lib/store";

function ReviewForm() {
  const router = useRouter();
  const params = useSearchParams();
  const visitId = params.get("visit") ?? undefined;
  const { bookings, addReview } = useStore();
  const visit = useMemo(
    () => bookings.find((item) => item.id === visitId),
    [bookings, visitId]
  );

  const [rating, setRating] = useState(5);
  const [name, setName] = useState(visit?.draft.name ?? "");
  const [text, setText] = useState("");
  const [wear, setWear] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (name.trim().length < 2 || text.trim().length < 8) {
      setError("Add your name and a short note.");
      return;
    }
    addReview({
      name: name.trim(),
      rating,
      text: text.trim(),
      serviceLabel: visit?.quote.summary ?? "Jibbynails set",
      visitId,
      wearWeeks: wear || undefined,
    });
    router.push("/reviews");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-6">
        <p className="eyebrow">After your set</p>
        <h1 className="font-heading mt-1.5 text-[2.15rem] leading-none tracking-tight">
          Leave a review
        </h1>
        {visit ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {visit.quote.summary} · {visit.draft.date}
          </p>
        ) : null}

        <div className="mt-6 space-y-5">
          <StarRating value={rating} onChange={setRating} />
          <div className="grid grid-cols-3 gap-2">
            {["2 weeks", "3 weeks", "4 weeks+"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setWear(item)}
                className={`press h-11 rounded-xl border text-sm ${
                  wear === item ? "border-ink bg-ink text-primary-foreground" : "border-ink/15 bg-card"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="reviewer">Name</Label>
            <Input
              id="reviewer"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-12 bg-card"
            />
          </div>
          <div>
            <Label htmlFor="body">How was the set?</Label>
            <Textarea
              id="body"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="mt-1.5 min-h-28 bg-card"
              placeholder="Gel-X medium, fruit art. Held 2 weeks."
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="button" onClick={submit} className="btn-gold w-full">
            Post
          </button>
          <Link href="/reviews" className="block text-center text-sm text-muted-foreground">
            Not now
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <ReviewForm />
    </Suspense>
  );
}
