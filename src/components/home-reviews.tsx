import Image from "next/image";
import Link from "next/link";
import { studio } from "@/lib/studio";

export function HomeReviews() {
  const cover = studio.gallery[0]?.src || "/brand/gallery-1.jpg";
  return (
    <section className="pb-6 pt-10 md:pt-14">
      <div className="flex items-end justify-between">
        <h2 className="font-heading text-[2.4rem] leading-none lg:text-[3rem]">Reviews</h2>
        <Link className="text-sm underline decoration-ink/30 underline-offset-4" href="/reviews">
          Write one
        </Link>
      </div>
      <Link className="press relative mt-4 block overflow-hidden rounded-3xl md:hidden" href="/review">
        <span className="relative block h-40">
          <Image src={cover} alt="" fill className="object-cover" />
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-sm text-white">
          No reviews yet. Be the first.
        </span>
      </Link>
      <Link className="press surface mt-6 hidden max-w-[26.25rem] overflow-hidden rounded-3xl border border-ink/10 md:flex" href="/review">
        <span className="relative aspect-square w-40 shrink-0">
          <Image src={cover} alt="" fill className="object-cover" />
        </span>
        <span className="flex items-center p-5 text-sm">No reviews yet. Be the first.</span>
      </Link>
    </section>
  );
}
