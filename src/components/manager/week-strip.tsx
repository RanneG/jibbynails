import Link from "next/link";
import { dayHours, type DayOverride } from "@/lib/slots";
import { isActive } from "@/lib/manager";
import type { StudioBooking } from "@/lib/server-store";
import { cn } from "@/lib/utils";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekStrip({
  week,
  date,
  today,
  bookings,
  overrides,
  hrefFor,
}: {
  week: string[];
  date: string;
  today: string;
  bookings: StudioBooking[];
  overrides: DayOverride[];
  hrefFor: (day: string) => string;
}) {
  return (
    <div className="surface flex gap-1 rounded-3xl p-2">
      {week.map((day, index) => {
        const hours = dayHours(day, overrides);
        const count = bookings.filter((item) => isActive(item) && item.date === day).length;
        const selected = day === date;
        const isToday = day === today;
        return (
          <Link
            key={day}
            href={hrefFor(day)}
            aria-current={selected ? "date" : undefined}
            className={cn(
              "press flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-2",
              selected ? "bg-ink text-card" : hours.closed && count === 0 ? "text-muted-foreground/60" : "text-ink",
              isToday && !selected && "ring-1 ring-inset ring-ink/30"
            )}
          >
            <span className="text-[10px] tracking-wide">{LETTERS[index]}</span>
            <span className="text-base font-medium leading-none">{Number(day.slice(-2))}</span>
            <span className="flex h-1.5 gap-0.5">
              {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                <span key={i} className={cn("size-1.5 rounded-full", selected ? "bg-card" : "bg-ink")} />
              ))}
              {count === 0 && hours.closed ? <span className="text-[9px] leading-[6px]">×</span> : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
