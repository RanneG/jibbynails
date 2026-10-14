import Link from "next/link";
import { formatClock, prettyDay } from "@/lib/hours";
import { firstName, todayDate, type RosterDay } from "@/lib/manager";
import { cn } from "@/lib/utils";

export function RosterWeek({
  days,
  hrefFor,
}: {
  days: RosterDay[];
  hrefFor: (date: string) => string;
}) {
  const today = todayDate();
  return (
    <div className="flex gap-1">
      {days.map((day) => {
        const open = !day.hours.closed;
        const isToday = day.date === today;
        return (
          <Link
            key={day.date}
            href={hrefFor(day.date)}
            className={cn(
              "press flex min-h-[7.5rem] min-w-0 flex-1 flex-col rounded-2xl px-1 py-2 sm:min-h-[8rem] sm:px-2",
              open ? "bg-sky text-ink" : "bg-ink text-card/85",
              isToday && (open ? "ring-2 ring-inset ring-ink" : "ring-2 ring-inset ring-card")
            )}
          >
            <span className="text-[10px] tracking-wide opacity-70">{prettyDay(day.date).split(" ")[0]}</span>
            <span className="text-sm font-medium leading-none">{Number(day.date.slice(-2))}</span>
            <span className="mt-auto text-[10px] leading-tight sm:text-[11px]">
              {open ? (
                <>
                  {day.employee ? <span className="mb-0.5 block truncate">{firstName(day.employee.name)}</span> : null}
                  <span className="block">{formatClock(day.hours.openHour).replace(":00", "")}</span>
                  <span className="block opacity-70">{formatClock(day.hours.closeHour).replace(":00", "")}</span>
                </>
              ) : (
                <span className="block">Off</span>
              )}
              {day.count ? (
                <span className="mt-1 block opacity-70">
                  {day.count} {day.count === 1 ? "set" : "sets"}
                </span>
              ) : day.holds ? (
                <span className="mt-1 block opacity-70">break</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
