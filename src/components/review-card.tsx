import Image from "next/image";
import type { StoredReview } from "@/lib/server-store";

export function ReviewCard({ review }: { review: StoredReview }) {
  return (
    <article className="surface overflow-hidden rounded-3xl">
      {review.photoUrl ? (
        <div className="relative aspect-[4/3]">
          <Image src={review.photoUrl} alt="" fill className="object-cover" />
        </div>
      ) : null}
      <div className="p-4">
        <p className="text-sm tracking-wide" aria-label={`${review.rating} stars`}>
          {"★".repeat(review.rating)}
          <span className="text-ink/20">{"★".repeat(5 - review.rating)}</span>
        </p>
        <p className="mt-3 text-sm leading-6">{review.text}</p>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground">{review.name}</p>
      </div>
    </article>
  );
}
