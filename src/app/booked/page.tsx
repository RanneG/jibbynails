import Image from "next/image";
import Link from "next/link";
import { consultQuote } from "@/lib/booking-url";
import { formatClockTime, prettyDay } from "@/lib/hours";
import { emptyDraft } from "@/lib/types";
import { formatDuration, formatMoney } from "@/lib/pricing";
import { findBooking } from "@/lib/server-store";
import { studio } from "@/lib/studio";
import { SaveVisit } from "./save-visit";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function BookedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const stored = first(raw.id) ? await findBooking(first(raw.id)) : null;

  if (!stored) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center md:mx-auto md:max-w-lg">
        <h1 className="font-heading text-[2.6rem] leading-none">Booking not found</h1>
        <Link href="/book" className="btn-gold mt-6 px-8">
          Book
        </Link>
      </div>
    );
  }

  const quote = consultQuote(stored.hours);
  const draft = emptyDraft();
  draft.name = stored.name;
  draft.phone = stored.phone;
  draft.email = stored.email;
  draft.inspo = stored.inspo;
  draft.date = stored.date;
  draft.time = stored.time;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:mx-auto md:w-full md:max-w-lg">
      <div className="px-5 pt-8">
        <p className="pill">Booked</p>
        <h1 className="font-heading mt-4 text-[2.8rem] leading-none">
          {prettyDay(stored.date)}
          <br />
          {formatClockTime(stored.time)}
        </h1>
        <p className="mt-3 text-sm tracking-wide text-muted-foreground">
          {stored.name} · {studio.location}
        </p>
      </div>
      <div className="relative mx-auto mt-6 h-40 w-[12.5rem] overflow-hidden rounded-2xl">
        <Image src="/brand/hero.jpg" alt="" fill className="object-cover" />
      </div>
      <div className="flex-1 px-5 pb-8 pt-6">
        <div className="surface rounded-3xl p-5">
          {quote.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-3 py-1 text-sm">
              <span className="text-muted-foreground">{line.label} deposit</span>
              <span>{formatMoney(line.amount)}</span>
            </div>
          ))}
          {draft.inspo ? <p className="mt-3 text-sm text-muted-foreground">{draft.inspo}</p> : null}
          <div className="mt-3 flex justify-between border-t border-ink/8 pt-3 font-medium">
            <span>{formatDuration(quote.minutes)}</span>
            <span>{formatMoney(quote.total)}</span>
          </div>
        </div>
        <p className="mt-4 text-sm tracking-wide text-muted-foreground">
          Balance in cash on the day. This slot is held — nobody else can take it.
        </p>
        <SaveVisit id={stored.id} draft={draft} quote={quote} />
        <Link href="/account" className="btn-gold mt-5">
          Your bookings
        </Link>
        <Link href="/review" className="mt-4 block text-center text-sm underline underline-offset-4">
          Leave a review
        </Link>
      </div>
    </div>
  );
}
