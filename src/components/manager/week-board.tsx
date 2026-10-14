import Link from "next/link";
import { formatClockTime, prettyDay } from "@/lib/hours";
import {
  boardRows,
  chairBlocks,
  holdBlocks,
  isActive,
  minutesNow,
  tierWash,
  todayDate,
  weekBoardRange,
} from "@/lib/manager";
import type { StudioBooking } from "@/lib/server-store";
import { dayHours, type DayOverride, type TimeHold } from "@/lib/slots";
import { cn } from "@/lib/utils";

const LETTERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekBoard({
  week,
  bookings,
  overrides,
  holds = [],
}: {
  week: string[];
  bookings: StudioBooking[];
  overrides: DayOverride[];
  holds?: TimeHold[];
}) {
  const { start, end } = weekBoardRange(week, bookings, overrides, holds);
  const rows = boardRows(start, end);
  const today = todayDate();
  const now = minutesNow();
  const showNow = now >= start && now <= end && week.includes(today);
  const nowTop = ((now - start) / (end - start)) * 100;

  return (
    <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      <div className="min-w-[40rem]">
        <div className="mb-2 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] gap-1">
          <div />
          {week.map((day, index) => {
            const hours = dayHours(day, overrides);
            const count = bookings.filter((item) => item.date === day && isActive(item)).length;
            const isToday = day === today;
            return (
              <Link
                key={day}
                href={`/owner/schedule?date=${day}&view=day`}
                className={cn(
                  "press rounded-2xl px-2 py-1.5 text-center",
                  isToday ? "bg-ink text-card" : "text-ink hover:bg-ink/5"
                )}
              >
                <span className="block text-[10px] tracking-wide opacity-70">{LETTERS[index]}</span>
                <span className="block text-sm font-medium leading-none">{Number(day.slice(-2))}</span>
                <span className="mt-0.5 block text-[10px] opacity-70">
                  {hours.closed && count === 0 ? "Off" : count ? `${count}` : "·"}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-card">
          <div
            className="grid"
            style={{
              gridTemplateColumns: "3.25rem repeat(7, minmax(0, 1fr))",
              gridTemplateRows: `repeat(${rows.length}, 1.7rem)`,
            }}
          >
            {rows.map((minute, index) => (
              <div
                key={`label-${minute}`}
                className={cn(
                  "pr-2 text-right text-[10px] leading-none text-muted-foreground",
                  minute % 60 === 0 ? "pt-1" : "opacity-0"
                )}
                style={{ gridColumn: 1, gridRow: index + 1 }}
              >
                {minute % 60 === 0 ? formatClockTime(stamp(minute)).replace(":00", "") : ""}
              </div>
            ))}

            {week.map((day, dayIndex) => {
              const hours = dayHours(day, overrides);
              const closed = hours.closed;
              return (
                <div
                  key={`bg-${day}`}
                  className={cn("border-l border-ink/8", closed && "bg-ink/[0.03]")}
                  style={{ gridColumn: dayIndex + 2, gridRow: `1 / span ${rows.length}` }}
                />
              );
            })}

            {rows.map((minute, index) =>
              minute % 60 === 0 ? (
                <div
                  key={`line-${minute}`}
                  className="pointer-events-none border-t border-ink/10"
                  style={{ gridColumn: "2 / span 7", gridRow: index + 1 }}
                />
              ) : null
            )}

            {week.map((day, dayIndex) =>
              chairBlocks(day, bookings, start).map((block) => (
                <Link
                  key={block.booking.id}
                  href={`/owner/booking/${block.booking.id}`}
                  prefetch={false}
                  title={`${block.booking.name} · ${prettyDay(day)}`}
                  className={cn(
                    "press relative z-10 mx-0.5 overflow-hidden rounded-lg px-1.5 py-0.5",
                    tierWash(block.booking.hours)
                  )}
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: `${block.row} / span ${block.span}`,
                  }}
                >
                  <span className="block truncate text-[11px] font-medium leading-tight">{block.booking.name}</span>
                  {block.span >= 2 ? (
                    <span className="block truncate text-[10px] leading-tight opacity-75">
                      {formatClockTime(block.booking.time)}
                    </span>
                  ) : null}
                </Link>
              ))
            )}

            {week.map((day, dayIndex) =>
              holdBlocks(day, holds, start).map((block) => (
                <div
                  key={block.hold.id}
                  title={`${block.hold.note || "Booked out"} · ${prettyDay(day)}`}
                  className="buffer-hatch relative z-10 mx-0.5 overflow-hidden rounded-lg bg-muted px-1.5 py-0.5"
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: `${block.row} / span ${block.span}`,
                  }}
                >
                  <span className="block truncate text-[11px] font-medium leading-tight">
                    {block.hold.note || "Out"}
                  </span>
                </div>
              ))
            )}
          </div>
          {showNow ? (
            <div
              className="pointer-events-none absolute left-[3.25rem] right-0 z-20"
              style={{ top: `${nowTop}%` }}
            >
              <div className="h-px bg-destructive" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function stamp(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
