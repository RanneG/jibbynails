import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Banner } from "@/components/manager/banner";
import { RosterWeek } from "@/components/manager/roster-week";
import { formatClock, formatClockTime, prettyDay } from "@/lib/hours";
import { firstName, isActive, isValidDate, todayDate, weekOf, weekRoster, whoOn } from "@/lib/manager";
import { requireOwner } from "@/lib/owner";
import {
  DEFAULT_EMPLOYEE_ID,
  listBookings,
  listEmployees,
  listHolds,
  listOverrides,
  listShifts,
} from "@/lib/server-store";
import { addDays, clockStamps, dayHours, holdMinutes } from "@/lib/slots";
import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hours — Manager",
};

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am – 10pm

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function message(saved: string, err: string, date: string) {
  const day = isValidDate(date) ? prettyDay(date) : "That day";
  if (saved === "closed") return { text: `${day} is closed. Nobody can book it.`, tone: "ok" as const };
  if (saved === "hours") return { text: `${day} is on the rota.`, tone: "ok" as const };
  if (saved === "usual") return { text: `${day} is back to the usual week.`, tone: "ok" as const };
  if (saved === "hold") return { text: `${day} has that time booked out. Nobody can take it.`, tone: "ok" as const };
  if (saved === "unhold") return { text: "That break is gone. People can book it again.", tone: "ok" as const };
  if (saved === "team") return { text: "They’re on the books. Put them on a day in the roster.", tone: "ok" as const };
  if (saved === "gone") return { text: "Removed. Their days went back to Jibby.", tone: "ok" as const };
  if (err === "date") return { text: "Pick a date.", tone: "warn" as const };
  if (err === "past") return { text: "That day has already been.", tone: "warn" as const };
  if (err === "hours") return { text: "Closing time needs to be after opening.", tone: "warn" as const };
  if (err === "hold") return { text: "Pick a start and end, with the end later.", tone: "warn" as const };
  if (err === "window") return { text: "That break has to sit inside the day’s hours.", tone: "warn" as const };
  if (err === "closed") return { text: "Open the day first, then book out a break.", tone: "warn" as const };
  if (err === "overlap") return { text: "That overlaps a booking or another break.", tone: "warn" as const };
  if (err === "name") return { text: "Add their name — at least two letters.", tone: "warn" as const };
  if (err === "exists") return { text: "Someone’s already on the books with that name.", tone: "warn" as const };
  if (err === "default") return { text: "Jibby stays on the rota — she’s the default.", tone: "warn" as const };
  if (err === "team") return { text: "Pick someone who’s on the books.", tone: "warn" as const };
  return null;
}

export default async function HoursPage({ searchParams }: PageProps<"/owner/hours">) {
  await requireOwner();
  const raw = await searchParams;
  const today = todayDate();
  const picked = isValidDate(first(raw.date)) ? first(raw.date) : "";
  const [overrides, bookings, holds, employees, shifts] = await Promise.all([
    listOverrides(),
    listBookings(),
    listHolds(),
    listEmployees(),
    listShifts(),
  ]);
  const note = message(first(raw.saved), first(raw.err), picked);

  const current = picked ? dayHours(picked, overrides) : null;
  const onChair = current ? whoOn(picked, current, shifts, employees) : null;
  const upcoming = overrides.filter((item) => item.date >= today);
  const bookingsOn = (date: string) => bookings.filter((item) => isActive(item) && item.date === date).length;
  const weekDates = weekOf(picked || today);
  const roster = weekRoster(weekDates, bookings, overrides, shifts, employees, holds);
  const dayHolds = picked ? holds.filter((item) => item.date === picked) : [];
  const upcomingHolds = holds.filter((item) => item.date >= today);
  const stamps = current && !current.closed ? clockStamps(current.openHour, current.closeHour) : clockStamps(9, 19);
  const lunchStart = stamps.includes("12:00") ? "12:00" : stamps[0];
  const lunchEnd = stamps.includes("13:00") ? "13:00" : stamps[Math.min(2, stamps.length - 1)];

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8">
      <h1 className="font-heading text-[2.8rem] leading-none">Hours</h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground">
        Close a day, book out a break, or put someone on the rota. The booking calendar follows straight away.
      </p>
      <Banner message={note?.text} tone={note?.tone} />

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[1.85rem] leading-none">Roster</h2>
          <div className="flex gap-1">
            <Link
              href={`/owner/hours?date=${addDays(weekDates[0], -7)}`}
              aria-label="Previous week"
              className="press flex size-9 items-center justify-center rounded-full border border-ink/15"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={`/owner/hours?date=${addDays(weekDates[0], 7)}`}
              aria-label="Next week"
              className="press flex size-9 items-center justify-center rounded-full border border-ink/15"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="mt-3">
          <RosterWeek days={roster} hrefFor={(day) => `/owner/hours?date=${day}`} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Tap a day to change hours, who’s on, or book out a break.</p>
      </section>

      <section className="surface mt-6 rounded-3xl p-4">
        <p className="eyebrow">Change a day</p>
        <form action="/api/owner/hours" method="post" className="mt-3 space-y-3">
          <label className="block text-sm">
            Which day
            <input
              type="date"
              name="date"
              required
              min={today}
              defaultValue={picked}
              className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
            />
          </label>
          {current ? (
            <p className="text-xs text-muted-foreground">
              Right now: {current.closed ? "closed" : `${formatClock(current.openHour)} – ${formatClock(current.closeHour)}`}
              {onChair ? ` · ${onChair.name}` : ""}
              {current.override ? " (already changed)" : " (usual)"}
              {bookingsOn(picked) ? ` · ${bookingsOn(picked)} booked that day` : ""}
              {dayHolds.length ? ` · ${dayHolds.length} booked out` : ""}
            </p>
          ) : null}

          <fieldset>
            <legend className="mb-1.5 text-sm">Who’s on</legend>
            <div className="flex flex-wrap gap-2">
              <label className="press flex h-12 min-w-[4.5rem] cursor-pointer items-center justify-center rounded-full border border-ink/15 px-4 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-card">
                <input
                  type="radio"
                  name="employee"
                  value="off"
                  defaultChecked={!current || current.closed}
                  className="sr-only"
                />
                Off
              </label>
              {employees.map((person) => (
                <label
                  key={person.id}
                  className="press flex h-12 min-w-[4.5rem] cursor-pointer items-center justify-center rounded-full border border-ink/15 px-4 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-card"
                >
                  <input
                    type="radio"
                    name="employee"
                    value={person.id}
                    defaultChecked={Boolean(current && !current.closed && (onChair?.id ?? DEFAULT_EMPLOYEE_ID) === person.id)}
                    className="sr-only"
                  />
                  {firstName(person.name)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              Open
              <select
                name="open"
                defaultValue={String(current?.openHour ?? studio.openHour)}
                className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatClock(hour)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Close
              <select
                name="close"
                defaultValue={String(current?.closeHour ?? studio.closeHour)}
                className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatClock(hour)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Hours only count if someone’s on. Off closes the day.</p>

          <label className="block text-sm">
            Note to self
            <input
              name="note"
              maxLength={80}
              placeholder="Dentist · away · training day"
              className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
            />
          </label>
          <button type="submit" className="btn-gold w-full">
            Save this day
          </button>
        </form>
      </section>

      {current && !current.closed ? (
        <section className="surface mt-4 rounded-3xl p-4">
          <p className="eyebrow">Book out a break</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lunch, admin, a gap. That stretch is blocked on the public calendar.
          </p>
          <form action="/api/owner/hours" method="post" className="mt-3 space-y-3">
            <input type="hidden" name="action" value="hold" />
            <input type="hidden" name="date" value={picked} />
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                From
                <select
                  name="start"
                  defaultValue={lunchStart}
                  className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                >
                  {stamps.slice(0, -1).map((stamp) => (
                    <option key={stamp} value={stamp}>
                      {formatClockTime(stamp)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Until
                <select
                  name="end"
                  defaultValue={lunchEnd}
                  className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                >
                  {stamps.slice(1).map((stamp) => (
                    <option key={stamp} value={stamp}>
                      {formatClockTime(stamp)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              What for
              <input
                name="note"
                maxLength={40}
                placeholder="Lunch · admin · training"
                className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
              />
            </label>
            <button type="submit" className="press w-full rounded-full border border-ink/15 py-3 text-sm">
              Book out
            </button>
          </form>
          {dayHolds.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {dayHolds.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.note || "Booked out"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatClockTime(item.start)}–{formatClockTime(item.end)} · {holdMinutes(item)} min
                    </p>
                  </div>
                  <form action="/api/owner/hours" method="post">
                    <input type="hidden" name="action" value="unhold" />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="date" value={picked} />
                    <button type="submit" className="press rounded-full border border-ink/15 px-3 py-1.5 text-xs">
                      Free it
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-heading text-[2rem] leading-none">People</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add someone, then put them on a day in the roster above.</p>
        <form action="/api/owner/hours" method="post" className="mt-3 flex gap-2">
          <input type="hidden" name="action" value="add-employee" />
          {picked ? <input type="hidden" name="date" value={picked} /> : null}
          <input
            name="name"
            required
            minLength={2}
            maxLength={40}
            placeholder="Name"
            className="h-12 min-w-0 flex-1 rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
          />
          <button type="submit" className="press shrink-0 rounded-full bg-ink px-4 text-sm text-card">
            Add
          </button>
        </form>
        <ul className="surface mt-3 divide-y divide-ink/8 rounded-3xl px-4">
          {employees.map((person) => {
            const daysOn = shifts.filter((item) => item.employeeId === person.id && item.date >= today).length;
            const isDefault = person.id === DEFAULT_EMPLOYEE_ID;
            return (
              <li key={person.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isDefault ? "Default" : daysOn ? `${daysOn} day${daysOn === 1 ? "" : "s"} coming up` : "Not on the rota yet"}
                  </p>
                </div>
                {isDefault ? null : (
                  <form action="/api/owner/hours" method="post">
                    <input type="hidden" name="action" value="remove-employee" />
                    <input type="hidden" name="id" value={person.id} />
                    {picked ? <input type="hidden" name="date" value={picked} /> : null}
                    <button type="submit" className="press rounded-full border border-ink/15 px-3 py-1.5 text-xs">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {upcomingHolds.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-[2rem] leading-none">Booked out</h2>
          <ul className="mt-3 space-y-2">
            {upcomingHolds.map((item) => (
              <li key={item.id} className="surface flex items-center gap-3 rounded-3xl px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{prettyDay(item.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatClockTime(item.start)}–{formatClockTime(item.end)}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                </div>
                <Link href={`/owner/schedule?date=${item.date}`} className="text-xs underline underline-offset-4">
                  Day
                </Link>
                <form action="/api/owner/hours" method="post">
                  <input type="hidden" name="action" value="unhold" />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="date" value={item.date} />
                  <button type="submit" className="press rounded-full border border-ink/15 px-3 py-1.5 text-xs">
                    Free it
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-heading text-[2rem] leading-none">Changed days</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing changed. Every day runs on the usual week.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((item) => {
              const count = bookingsOn(item.date);
              const person = whoOn(item.date, dayHours(item.date, overrides), shifts, employees);
              return (
                <li key={item.date} className="surface flex items-center gap-3 rounded-3xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{prettyDay(item.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.closed ? "Closed" : `${formatClock(item.openHour ?? studio.openHour)} – ${formatClock(item.closeHour ?? studio.closeHour)}`}
                      {person ? ` · ${person.name}` : ""}
                      {item.note ? ` · ${item.note}` : ""}
                    </p>
                    {count ? (
                      <Link
                        href={`/owner/schedule?date=${item.date}`}
                        className={cn("mt-1 inline-block text-xs underline underline-offset-4", item.closed ? "text-destructive" : "")}
                      >
                        {count} {count === 1 ? "booking" : "bookings"} that day
                        {item.closed ? " — message or cancel them" : ""}
                      </Link>
                    ) : null}
                  </div>
                  <form action="/api/owner/hours" method="post">
                    <input type="hidden" name="date" value={item.date} />
                    <input type="hidden" name="action" value="remove" />
                    <button type="submit" className="press rounded-full border border-ink/15 px-3 py-1.5 text-xs">
                      Back to usual
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-[2rem] leading-none">Usual week</h2>
        <ul className="surface mt-3 divide-y divide-ink/8 rounded-3xl px-4">
          {studio.hoursLabel.map((row) => (
            <li key={row.day} className="flex items-baseline justify-between py-2.5 text-sm">
              <span className={row.hours === "Closed" ? "text-muted-foreground" : ""}>{row.day}</span>
              <span className={row.hours === "Closed" ? "text-muted-foreground" : ""}>
                {row.hours === "Closed" ? "Closed" : `${row.hours} · Jibby`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          The usual week is set in the site itself. Use this page for one-off days, breaks, and who’s on.
        </p>
      </section>
    </main>
  );
}
