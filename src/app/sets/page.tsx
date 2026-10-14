import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { TierCover } from "@/components/tier-cover";
import { consultLengths, type ConsultLength } from "@/lib/hours";
import { formatMoney } from "@/lib/pricing";
import { bookTierHref, shotsForTier, tierAnchor } from "@/lib/sets";
import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sets — Jibbynails",
};

export default function SetsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-8 md:mx-auto md:w-full md:max-w-[60rem] md:px-8 md:pb-16">
        <h1 className="font-heading text-center text-[3.1rem] leading-none">Sets</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm tracking-wide text-muted-foreground">
          Four slots. Find the one that looks like what you want, then book that one. Deposit is £15 an hour.
        </p>

        <nav
          aria-label="Tiers"
          className="sticky top-0 z-30 -mx-5 mt-6 flex gap-2 overflow-x-auto bg-background/90 px-5 py-3 backdrop-blur-xl md:top-[4.35rem] md:mx-0 md:justify-center md:px-0"
        >
          {consultLengths.map((tier) => (
            <a
              key={tier.tier}
              href={`#${tierAnchor(tier)}`}
              className="press shrink-0 rounded-full border border-ink/15 bg-card px-4 py-2 text-sm"
            >
              {tier.tier} · {tier.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 space-y-14 md:mt-10 md:space-y-20">
          {consultLengths.map((tier) => (
            <TierSection key={tier.tier} tier={tier} />
          ))}
        </div>

        <p className="mt-14 text-center text-sm tracking-wide text-muted-foreground">
          More on{" "}
          <a href={studio.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {studio.handle}
          </a>
          . Not sure which tier? Book the longer one — she’ll only use what the set needs.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

function TierSection({ tier }: { tier: ConsultLength }) {
  const shots = shotsForTier(tier.hours);

  return (
    <section
      id={tierAnchor(tier)}
      className="scroll-mt-20 md:grid md:scroll-mt-36 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:items-start md:gap-10"
    >
      <div className="text-center md:sticky md:top-32 md:text-left">
        <span className="pill">
          {tier.tier} · {tier.label}
        </span>
        <h2 className="font-heading mt-3 text-[2.6rem] leading-none lg:text-[3rem]">{tier.name}</h2>
        <p className="mt-2 text-sm leading-6 tracking-wide text-muted-foreground">{tier.detail}</p>
        <ul className="mx-auto mt-4 inline-block space-y-1.5 text-left text-sm leading-5 md:mx-0 md:block">
          {tier.includes.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <span className="font-medium">{tier.setRange}</span>
          <span className="text-muted-foreground"> on the day · {formatMoney(tier.price)} deposit</span>
        </p>
        <Link href={bookTierHref(tier)} className="btn-gold mt-5 md:max-w-xs">
          Book {tier.tier} · {tier.label}
        </Link>
      </div>

      <div className="mt-6 md:mt-0">
        {shots.length === 0 ? (
          <div className="surface rounded-3xl p-4">
            <TierCover hours={tier.hours} className="aspect-[4/3] rounded-2xl" />
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              Any one colour from her rack, on an overlay, infill, or plain set. No art, so no photo needed.
            </p>
          </div>
        ) : (
          <div className={cn("grid gap-3", shots.length > 1 && "grid-cols-2")}>
            {shots.map((shot) => (
              <figure key={shot.src} className="surface overflow-hidden rounded-3xl">
                <div className={cn("relative", shots.length > 1 ? "aspect-[4/5]" : "aspect-[4/5] md:aspect-[5/4]")}>
                  <Image src={shot.src} alt={shot.alt} fill className="object-cover" />
                </div>
                <figcaption className="px-4 py-3 text-xs leading-5 text-muted-foreground">{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
