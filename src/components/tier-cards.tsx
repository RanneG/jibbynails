import Link from "next/link";
import { TierCover } from "@/components/tier-cover";
import { consultLengths } from "@/lib/hours";
import { setsHref } from "@/lib/sets";

/** Home page: the four slots as pictures, so people pick by look, not by reading. */
export function TierCards() {
  return (
    <section className="pt-10 md:pt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-[2.4rem] leading-none lg:text-[3rem]">Which set are you?</h2>
          <p className="mt-2 text-sm tracking-wide text-muted-foreground">
            Four slots. Pick the one that looks like what you want.
          </p>
        </div>
        <Link href="/sets" className="shrink-0 text-sm underline decoration-ink/30 underline-offset-4">
          Compare
        </Link>
      </div>
      <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
        {consultLengths.map((tier, index) => (
          <Link
            key={tier.tier}
            href={setsHref(tier)}
            className="press surface w-[13.5rem] shrink-0 snap-start overflow-hidden rounded-3xl md:w-auto"
          >
            <TierCover hours={tier.hours} className="aspect-[4/5]" priority={index < 2} />
            <span className="block p-4">
              <span className="eyebrow">
                {tier.tier} · {tier.label}
              </span>
              <span className="mt-1.5 block font-medium">{tier.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{tier.setRange} on the day</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
