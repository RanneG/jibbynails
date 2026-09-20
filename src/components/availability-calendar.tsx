"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bookHref, type BookState } from "@/lib/booking-url";
import { formatClockTime, prettyDay } from "@/lib/hours";
import {
  generateMonth,
  monthLabel,
  monthMatrix,
  nextAvailable,
  shiftMonth,
  todayKey,
  type OccupiedSlot,
} from "@/lib/slots";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_MONTHS_AHEAD = 6;

export function AvailabilityCalendar({
  book,
  occupied,
  taken,
}: {
  book: BookState;
  occupied: OccupiedSlot[];
  taken?: boolean;
}) {
  const todayMonth = todayKey().slice(0, 7);
  const maxMonth = shiftMonth(todayMonth, MAX_MONTHS_AHEAD);
  const [view, setView] = useState(() => book.date?.slice(0, 7) || todayMonth);

  useEffect(() => {
    if (book.date) setView(book.date.slice(0, 7));
  }, [book.date]);

  const minutes = (book.hours || 1) * 60;
  const [year, monthNum] = view.split("-").map(Number);
  const days = useMemo(
    () => generateMonth(year, monthNum, minutes, occupied),
    [year, monthNum, minutes, occupied]
  );
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const weeks = monthMatrix(year, monthNum);
  const selected = book.date ? byDate.get(book.date) : undefined;
  const selectedEmpty = Boolean(book.date && (!selected || selected.times.length === 0));
  const upcoming = nextAvailable(minutes, occupied, selectedEmpty ? book.date : undefined);

  const prev = shiftMonth(view, -1);
  const next = shiftMonth(view, 1);
  const canPrev = prev >= todayMonth;
  const canNext = next <= maxMonth;

  return (
    <div>
      {taken ? (
        <p className="mb-3 rounded-full bg-sky px-4 py-2 text-sm">That time was just taken. Pick another.</p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{monthLabel(year, monthNum)}</p>
        <div className="flex gap-1">
          {canPrev ? (
            <button
              type="button"
              onClick={() => setView(prev)}
              className="press flex size-9 items-center justify-center rounded-full border border-ink/15"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => canNext && setView(next)}
            disabled={!canNext}
            className="press flex size-9 items-center justify-center rounded-full border border-ink/15 disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {upcoming ? (
        <Link
          href={bookHref({ ...book, date: upcoming.date, time: undefined, step: "when" })}
          className="mt-3 inline-block text-sm underline decoration-ink/30 underline-offset-4"
        >
          Next available · {prettyDay(upcoming.date)}
        </Link>
      ) : null}

      <div className="surface mt-4 rounded-3xl px-3 py-4">
        <div className="grid grid-cols-7 text-center text-[11px] tracking-[0.16em] text-muted-foreground">
          {WEEKDAYS.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-y-1">
          {weeks.flat().map((date, index) => {
            if (!date) return <span key={`e-${index}`} />;
            const day = byDate.get(date);
            const past = date < todayKey();
            const closed = Boolean(day?.closed);
            const full = Boolean(day && !day.closed && day.times.length === 0);
            const open = Boolean(day && day.times.length > 0);
            const selectedDay = book.date === date;
            const num = Number(date.slice(-2));
            const className = cn(
              "press relative mx-auto flex size-10 items-center justify-center rounded-full text-sm",
              selectedDay && "bg-ink text-primary-foreground",
              !selectedDay && open && "hover:bg-sky",
              !selectedDay && (past || closed || full) && "text-muted-foreground/45",
              past && "pointer-events-none"
            );
            if (past) {
              return (
                <span key={date} className={className}>
                  {num}
                </span>
              );
            }
            return (
              <Link
                key={date}
                href={bookHref({ ...book, date, time: undefined, step: "when" })}
                className={className}
                aria-label={
                  closed ? `${prettyDay(date)}, closed` : full ? `${prettyDay(date)}, full` : prettyDay(date)
                }
              >
                {num}
              </Link>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="mt-5">
          <p className="text-sm">{prettyDay(selected.date)}</p>
          {selected.closed || selected.times.length === 0 ? (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Sorry, nothing today.</p>
              {upcoming ? (
                <Link
                  href={bookHref({ ...book, date: upcoming.date, time: undefined, step: "when" })}
                  className="btn-gold mt-3"
                >
                  Next available
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {selected.times.map((time) => (
                <Link
                  key={time}
                  href={bookHref({ ...book, time, step: "details" })}
                  className={cn(
                    "press flex h-11 items-center justify-center rounded-full border text-sm",
                    book.time === time ? "border-ink bg-ink text-primary-foreground" : "border-ink/15 bg-card"
                  )}
                >
                  {formatClockTime(time)}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Pick a date.</p>
      )}
    </div>
  );
}
