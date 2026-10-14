import Link from "next/link";
import { Check } from "lucide-react";
import { Banner } from "@/components/manager/banner";
import { BookingRow } from "@/components/manager/booking-row";
import { DayBoard } from "@/components/manager/day-board";
import { RosterWeek } from "@/components/manager/roster-week";
import { formatClock, prettyDay } from "@/lib/hours";
import {
  dayAgenda,
  greeting,
  isActive,
  isNew,
  isPast,
  sortByStart,
  sortNewestFirst,
  todayDate,
  weekOf,
  weekRoster,
  weekSummary,
} from "@/lib/manager";
import { isOwner, isOwnerKey, requireOwner } from "@/lib/owner";
import { formatMoney } from "@/lib/pricing";
import { listBookings, listEmployees, listHolds, listOverrides, listPrivateFeedback, listShifts } from "@/lib/server-store";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Manager — Jibbynails",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function OwnerTodayPage({ searchParams }: PageProps<"/owner">) {
  const raw = await searchParams;

  const key = first(raw.key);
  if (key && isOwnerKey(key)) {
    redirect((await isOwner()) ? "/owner" : `/api/owner/login?key=${encodeURIComponent(key)}`);
  }
  if (first(raw.view) === "notes") redirect("/owner/notes");
  await requireOwner();

  const [bookings, overrides, feedback, holds, employees, shifts] = await Promise.all([
    listBookings(),
    listOverrides(),
    listPrivateFeedback(),
    listHolds(),
    listEmployees(),
    listShifts(),
  ]);
  const today = todayDate();
  const agenda = dayAgenda(today, bookings, overrides, holds);
  const todays = agenda.items.filter((item) => item.kind === "booking").map((item) => item.booking);
  const todayHolds = agenda.items.filter((item) => item.kind === "hold");
  const stillToCome = todays.filter((item) => !isPast(item));
  const nextUp = sortByStart(bookings.filter((item) => isActive(item) && item.date > today))[0];
  const inbox = sortNewestFirst(bookings.filter(isNew));
  const weekDates = weekOf(today);
  const week = weekSummary(bookings, weekDates);
  const roster = weekRoster(weekDates, bookings, overrides, shifts, employees, holds);
  const saved = first(raw.saved);

  const dayLine = agenda.hours.closed
    ? todays.length > 0
      ? `${todays.length} on the chair · usually a day off`
      : agenda.hours.override?.note
        ? `Day off · ${agenda.hours.override.note}`
        : "Day off"
    : todays.length === 0
      ? `Nothing booked · chair free ${formatClock(agenda.hours.openHour)}–${formatClock(agenda.hours.closeHour)}`
      : `${todays.length} on the chair${stillToCome.length && stillToCome.length !== todays.length ? ` · ${stillToCome.length} still to come` : ""}`;

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8">
      <h1 className="font-heading text-[2.8rem] leading-none">
        {greeting()}, Jibby
      </h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground">
        {prettyDay(today)} · {dayLine}
      </p>
      <Banner message={saved === "seen" ? "All caught up." : undefined} />

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-[1.85rem] leading-none">Chair</h2>
          <Link href="/owner/hours" className="text-sm underline decoration-ink/30 underline-offset-4">
            Edit hours
          </Link>
        </div>
        <div className="mt-3">
          <RosterWeek days={roster} hrefFor={(day) => `/owner/schedule?date=${day}`} />
        </div>
      </section>

      <div className="mt-8 grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-[2rem] leading-none">Today</h2>
            <Link href={`/owner/schedule?date=${today}`} className="text-sm underline decoration-ink/30 underline-offset-4">
              Full day
            </Link>
          </div>
          {todays.length > 0 || todayHolds.length > 0 ? (
            <div className="mt-3 space-y-3">
              <DayBoard date={today} bookings={bookings} overrides={overrides} holds={holds} compact />
              <ul className="space-y-2 lg:hidden">
                {todays.map((booking) => (
                  <li key={booking.id}>
                    <BookingRow booking={booking} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {agenda.hours.closed ? "Enjoy the day." : "Nothing booked today."}
            </p>
          )}
          {nextUp ? (
            <div className="mt-5">
              <p className="eyebrow">Next up</p>
              <div className="mt-2">
                <BookingRow booking={nextUp} showDay />
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-[2rem] leading-none">New</h2>
            {inbox.length > 1 ? (
              <form action="/api/owner/booking" method="post">
                <input type="hidden" name="action" value="seen-all" />
                <input type="hidden" name="back" value="/owner?saved=seen" />
                <button type="submit" className="text-sm underline decoration-ink/30 underline-offset-4">
                  Mark all seen
                </button>
              </form>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Booked online, not opened yet.</p>
          {inbox.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">You’ve seen everything that’s come in.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {inbox.map((booking) => (
                <li key={booking.id} className="flex items-stretch gap-2">
                  <BookingRow booking={booking} showDay className="min-w-0 flex-1" />
                  <form action="/api/owner/booking" method="post" className="flex shrink-0 self-center">
                    <input type="hidden" name="action" value="seen" />
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="back" value="/owner" />
                    <button
                      type="submit"
                      aria-label={`Mark ${booking.name}'s booking as seen`}
                      title="Seen"
                      className="press flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink"
                    >
                      <Check className="size-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-[2rem] leading-none">This week</h2>
        <dl className="surface mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/8 sm:grid-cols-4">
          <Stat label="Bookings" value={String(week.bookings)} />
          <Stat label="Hours on chair" value={week.hours % 1 === 0 ? String(week.hours) : week.hours.toFixed(1)} />
          <Stat
            label="Deposits due"
            value={week.depositsDue.count ? formatMoney(week.depositsDue.amount) : "—"}
            hint={week.depositsDue.count ? `${week.depositsDue.count} to chase` : "All in"}
          />
          <Stat label="Taken so far" value={week.taken ? formatMoney(week.taken) : "—"} />
        </dl>
      </section>

      <section className="mt-8 flex flex-wrap gap-2">
        <Link href="/owner/quote" className="press rounded-full border border-ink/15 px-4 py-2 text-sm">
          Price a set
        </Link>
        <Link href="/owner/notes" className="press rounded-full border border-ink/15 px-4 py-2 text-sm">
          Private notes{feedback.length ? ` · ${feedback.length}` : ""}
        </Link>
        <Link href="/owner/hours" className="press rounded-full border border-ink/15 px-4 py-2 text-sm">
          Close or change a day
        </Link>
      </section>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <dt className="text-[11px] tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-medium leading-none">{value}</dd>
      {hint ? <dd className="mt-1 text-[11px] text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}
