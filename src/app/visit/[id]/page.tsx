"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { formatClockTime, prettyDay } from "@/lib/hours";
import { formatDuration, formatMoney } from "@/lib/pricing";
import { studio } from "@/lib/studio";
import { useStore } from "@/lib/store";

export default function VisitPage() {
  const { id } = useParams<{ id: string }>();
  const { bookings, ready } = useStore();
  const visit = bookings.find((item) => item.id === id);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-2xl">Visit not found</p>
        <Link href="/book" className="btn-gold mt-6 px-8">
          Book
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-8">
        <p className="eyebrow">Booked</p>
        <h1 className="font-heading mt-2 text-[2.15rem] leading-none tracking-tight">
          {prettyDay(visit.draft.date ?? "")}
          <br />
          <span className="text-gold">
            {visit.draft.time ? formatClockTime(visit.draft.time) : ""}
          </span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{studio.location}</p>

        <div className="surface mt-6 rounded-2xl p-5">
          {visit.quote.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-3 py-1 text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <span>{formatMoney(line.amount)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-ink/8 pt-3 font-medium">
            <span>{formatDuration(visit.quote.minutes)}</span>
            <span className="text-gold">{formatMoney(visit.quote.total)}</span>
          </div>
        </div>

        <Link href={`/review?visit=${visit.id}`} className="btn-gold mt-5">
          Leave a review
        </Link>
        <Link href="/" className="mt-4 block text-center text-sm text-muted-foreground">
          Home
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}
