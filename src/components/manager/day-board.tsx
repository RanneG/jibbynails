import Link from "next/link";
import { consultByHours, formatClockTime } from "@/lib/hours";
import {
  boardRange,
  boardRows,
  chairBlocks,
  holdBlocks,
  minutesNow,
  tierWash,
  todayDate,
  visitEnd,
} from "@/lib/manager";
import type { StudioBooking } from "@/lib/server-store";
import type { DayOverride, TimeHold } from "@/lib/slots";
import { cn } from "@/lib/utils";

const ROW = 2.55;

function hourLabel(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
}

export function DayBoard({
  date,
  bookings,
  overrides,
  holds = [],
  compact,
}: {
  date: string;
  bookings: StudioBooking[];
  overrides: DayOverride[];
  holds?: TimeHold[];
  compact?: boolean;
}) {
  const { start, end } = boardRange(date, bookings, overrides, holds);
  const rows = boardRows(start, end);
  const blocks = chairBlocks(date, bookings, start);
  const reserved = holdBlocks(date, holds, start);
  const rowPx = compact ? 1.85 : ROW;
  const now = minutesNow();
  const isToday = date === todayDate();
  const showNow = isToday && now >= start && now <= end;
  const nowTop = ((now - start) / (end - start)) * 100;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-card">
      <div
        className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)]"
        style={{ gridTemplateRows: `repeat(${rows.length}, ${rowPx}rem)` }}
      >
        {rows.map((minute, index) => {
          const hour = minute % 60 === 0;
          return (
            <div key={minute} className="contents">
              <div
                className={cn(
                  "pr-2 text-right text-[10px] leading-none text-muted-foreground",
                  hour ? "pt-1.5" : "pt-1 opacity-0"
                )}
                style={{ gridColumn: 1, gridRow: index + 1 }}
              >
                {hour ? hourLabel(minute) : ""}
              </div>
              <div
                className={cn("border-l border-ink/10", hour ? "border-t border-ink/10" : "border-t border-ink/5")}
                style={{ gridColumn: 2, gridRow: index + 1 }}
              />
            </div>
          );
        })}
        {blocks.map((block) => {
          const tier = consultByHours(block.booking.hours);
          return (
            <Link
              key={block.booking.id}
              href={`/owner/booking/${block.booking.id}`}
              prefetch={false}
              className={cn(
                "press relative z-10 ml-1 mr-2 overflow-hidden rounded-2xl",
                tierWash(block.booking.hours)
              )}
              style={{ gridColumn: 2, gridRow: `${block.row} / span ${block.span}` }}
            >
              <span className="flex h-full min-h-0 flex-col">
                <span
                  className="flex min-h-0 flex-col overflow-hidden px-2.5 py-1.5"
                  style={{ flexGrow: block.visitMinutes }}
                >
                  <span className="truncate text-[13px] font-medium leading-tight">{block.booking.name}</span>
                  {block.span >= 2 ? (
                    <span className="mt-0.5 truncate text-[11px] leading-tight opacity-80">
                      {tier ? `${tier.tier} · ${tier.name}` : `${block.booking.hours} h`}
                    </span>
                  ) : null}
                  {block.span >= 3 && !compact ? (
                    <span className="mt-0.5 text-[11px] opacity-70">
                      {formatClockTime(block.booking.time)}–{formatClockTime(visitEnd(block.booking))}
                    </span>
                  ) : null}
                </span>
                {block.bufferMinutes >= 15 ? (
                  <span
                    className="buffer-hatch flex items-center px-2.5 text-[10px] tracking-wide text-ink/50"
                    style={{ flexGrow: block.bufferMinutes }}
                  >
                    {block.bufferMinutes} min clear
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
        {reserved.map((block) => (
          <div
            key={block.hold.id}
            className="buffer-hatch relative z-10 ml-1 mr-2 overflow-hidden rounded-2xl bg-muted"
            style={{ gridColumn: 2, gridRow: `${block.row} / span ${block.span}` }}
          >
            <span className="flex h-full min-h-0 flex-col px-2.5 py-1.5">
              <span className="truncate text-[13px] font-medium leading-tight">{block.hold.note || "Booked out"}</span>
              {block.span >= 2 && !compact ? (
                <span className="mt-0.5 text-[11px] opacity-70">
                  {formatClockTime(block.hold.start)}–{formatClockTime(block.hold.end)}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      {showNow ? (
        <div
          className="pointer-events-none absolute left-[3rem] right-0 z-20"
          style={{ top: `${nowTop}%` }}
        >
          <div className="relative h-px bg-destructive">
            <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rounded-full bg-destructive" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

