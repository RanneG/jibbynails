import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { ReviewCard } from "@/components/review-card";
import { SocialLinks } from "@/components/social-links";
import { listPublicReviews } from "@/lib/server-store";
import { studio } from "@/lib/studio";

export const metadata = {
  title: "Reviews — Jibbynails",
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await listPublicReviews();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-6 md:mx-auto md:w-full md:max-w-3xl md:px-8">
        <p className="eyebrow">From the chair</p>
        <h1 className="font-heading mt-1.5 text-[2.15rem] leading-none tracking-tight md:text-center md:text-[3.1rem]">
          Reviews
        </h1>
        {reviews.length === 0 ? (
          <div className="mt-6 md:mt-8 md:text-center">
            <Link href="/review" className="press relative block overflow-hidden rounded-2xl md:hidden">
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
            <p className="hidden tracking-wide text-muted-foreground md:block">None on the site yet.</p>
            <p className="mt-2 hidden text-sm tracking-wide text-muted-foreground md:block">
              After a visit, leave one here — not only on Instagram.
            </p>
            <Link href="/review" className="btn-gold mt-4 md:mx-auto md:mt-5 md:max-w-xs">
              Leave a review
            </Link>
            <a href={studio.instagram} className="mt-4 block text-center text-sm md:hidden">
              {studio.handle}
            </a>
            <SocialLinks className="mt-5 hidden md:flex" />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <Link href="/review" className="btn-gold md:max-w-xs">
              Add yours
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
