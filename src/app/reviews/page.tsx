"use client";

import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { StarRating } from "@/components/star-rating";
import { studio } from "@/lib/studio";
import { useStore } from "@/lib/store";

export default function ReviewsPage() {
  const { reviews } = useStore();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-6">
        <p className="eyebrow">From the chair</p>
        <h1 className="font-heading mt-1.5 text-[2.15rem] leading-none tracking-tight">Reviews</h1>
        {reviews.length === 0 ? (
          <div className="mt-6">
            <Link href="/review" className="press relative block overflow-hidden rounded-2xl">
              <span className="relative block h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/gallery-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="block text-sm">None on the site yet.</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  After a visit, leave one here — not only on Instagram.
                </span>
              </span>
            </Link>
            <Link href="/review" className="btn-gold mt-4">
              Leave a review
            </Link>
            <a href={studio.instagram} className="mt-4 block text-center text-sm text-gold">
              {studio.handle}
            </a>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="surface rounded-2xl p-4">
                <StarRating value={review.rating} size="sm" />
                <p className="mt-3 text-sm leading-6">{review.text}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {review.name}
                  {review.serviceLabel ? ` · ${review.serviceLabel}` : ""}
                  {review.wearWeeks ? ` · ${review.wearWeeks}` : ""}
                </p>
              </article>
            ))}
            <Link href="/review" className="btn-gold">
              Add yours
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
