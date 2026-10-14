import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingRow } from "@/components/manager/booking-row";
import { DayBoard } from "@/components/manager/day-board";
import { WeekBoard } from "@/components/manager/week-board";
import { WeekStrip } from "@/components/manager/week-strip";
import { formatClock, formatClockTime, prettyDay } from "@/lib/hours";
import { dayAgenda, isValidDate, todayDate, weekOf, whoOn } from "@/lib/manager";
import { requireOwner } from "@/lib/owner";
import { formatDuration } from "@/lib/pricing";
import { listBookings, listEmployees, listHolds, listOverrides, listShifts } from "@/lib/server-store";
import { addDays, monthLabel } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Schedule — Manager",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function SchedulePage({ searchParams }: PageProps<"/owner/schedule">) {
  await requireOwner();
  const raw = await searchParams;
  const today = todayDate();
  const requested = first(raw.date);
  const date = isValidDate(requested) ? requested : today;
  const view = first(raw.view) === "week" ? "week" : "day";

  const [bookings, overrides, holds, employees, shifts] = await Promise.all([
    listBookings(),
    listOverrides(),
    listHolds(),
    listEmployees(),
    listShifts(),
  ]);
  const week = weekOf(date);
  const agenda = dayAgenda(date, bookings, overrides, holds);
  const person = whoOn(date, agenda.hours, shifts, employees);
  const [year, month] = date.split("-").map(Number);
  const hrefFor = (day: string) => `/owner/schedule?date=${day}${view === "week" ? "&view=week" : ""}`;

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-[2.4rem] leading-none">{monthLabel(year, month)}</h1>
        <div className="flex items-center gap-1">
          {date !== today || view !== "day" ? (
            <Link href="/owner/schedule" className="press rounded-full border border-ink/15 px-3 py-1.5 text-xs">
              Today
            </Link>
          ) : null}
          <Link
            href={`/owner/schedule?date=${addDays(week[0], -7)}${view === "week" ? "&view=week" : ""}`}
            aria-label="Previous week"
            className="press flex size-9 items-center justify-center rounded-full border border-ink/15"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/owner/schedule?date=${addDays(week[0], 7)}${view === "week" ? "&view=week" : ""}`}
            aria-label="Next week"
            className="press flex size-9 items-center justify-center rounded-full border border-ink/15"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-full border border-ink/15 p-1 w-fit">
        <Link
          href={`/owner/schedule?date=${date}`}
          className={cn(
            "press rounded-full px-4 py-1.5 text-sm",
            view === "day" ? "bg-ink text-card" : "text-muted-foreground"
          )}
        >
          Day
        </Link>
        <Link
          href={`/owner/schedule?date=${date}&view=week`}
          className={cn(
            "press rounded-full px-4 py-1.5 text-sm",
            view === "week" ? "bg-ink text-card" : "text-muted-foreground"
          )}
        >
          Week
        </Link>
      </div>

      {view === "day" ? (
        <>
          <div className="mt-4">
            <WeekStrip week={week} date={date} today={today} bookings={bookings} overrides={overrides} hrefFor={hrefFor} />
          </div>

          <section className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-heading text-[2rem] leading-none">{prettyDay(date)}</h2>
              <Link href={`/owner/hours?date=${date}`} className="text-sm underline decoration-ink/30 underline-offset-4">
                {agenda.hours.closed ? "Open this day" : "Change hours"}
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {agenda.hours.closed
                ? `Closed${agenda.hours.override?.note ? ` · ${agenda.hours.override.note}` : ""}`
                : `${formatClock(agenda.hours.openHour)} – ${formatClock(agenda.hours.closeHour)}${
                    person ? ` · ${person.name}` : ""
                  }${agenda.hours.override ? " · changed for this day" : ""}`}
              {agenda.bookedMinutes ? ` · ${formatDuration(agenda.bookedMinutes)} booked` : ""}
            </p>

            <div className="mt-4 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
              {agenda.hours.closed && agenda.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Day off. Nothing on the chair.</p>
              ) : (
                <DayBoard date={date} bookings={bookings} overrides={overrides} holds={holds} />
              )}

              <div className="lg:sticky lg:top-4">
                <p className="eyebrow">On the chair</p>
                {agenda.items.filter((item) => item.kind === "booking" || item.kind === "hold").length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {agenda.hours.closed ? "Nothing on." : "Whole day free."}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {agenda.items.map((item) =>
                      item.kind === "booking" ? (
                        <li key={item.booking.id}>
                          <BookingRow booking={item.booking} />
                        </li>
                      ) : item.kind === "hold" ? (
                        <li
                          key={item.hold.id}
                          className="buffer-hatch flex items-center justify-between rounded-3xl bg-muted px-4 py-2.5 text-sm"
                        >
                          <span>{item.hold.note || "Booked out"}</span>
                          <span className="text-muted-foreground">
                            {formatClockTime(item.hold.start)}–{formatClockTime(item.hold.end)}
                          </span>
                        </li>
                      ) : (
                        <li
                          key={`free-${item.start}`}
                          className="flex items-center justify-between rounded-3xl border border-dashed border-ink/20 px-4 py-2.5 text-sm text-muted-foreground"
                        >
                          <span>Free · {formatDuration(item.minutes)}</span>
                          <span>
                            {formatClockTime(item.start)}–{formatClockTime(item.end)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </div>

            {agenda.hours.closed && agenda.items.length > 0 ? (
              <p className="mt-3 rounded-2xl bg-pink px-4 py-2.5 text-sm leading-6">
                This day is closed but still has bookings. Open each one to message or cancel.
              </p>
            ) : null}

            {agenda.cancelled.length > 0 ? (
              <div className="mt-6">
                <p className="eyebrow">Cancelled</p>
                <ul className="mt-2 space-y-2">
                  {agenda.cancelled.map((booking) => (
                    <li key={booking.id}>
                      <BookingRow booking={booking} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section className="mt-5">
          <WeekBoard week={week} bookings={bookings} overrides={overrides} holds={holds} />
        </section>
      )}
    </main>
  );
}
