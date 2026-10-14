/**
 * Pure helpers for the manager. Nothing here touches disk, so pages and
 * components can import freely.
 */
import { chairBufferMinutes, consultRate, londonNow, timePlus } from "./hours";
import {
  DEFAULT_EMPLOYEE_ID,
  type ClientNote,
  type Shift,
  type StudioBooking,
  type StudioEmployee,
} from "./server-store";
import {
  addDays,
  bookingIsPast,
  dayHours,
  holdMinutes,
  timeToMinutes,
  todayKey,
  weekdayIndex,
  type DayHours,
  type DayOverride,
  type TimeHold,
} from "./slots";

export function greeting() {
  const { hour } = londonNow();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function isActive(booking: StudioBooking) {
  return booking.status !== "cancelled";
}

/** Booked online and she hasn't opened it yet. */
export function isNew(booking: StudioBooking) {
  return isActive(booking) && !booking.ownerSeenAt;
}

export function isPast(booking: StudioBooking) {
  return bookingIsPast(booking.date, booking.time, booking.hours);
}

export function depositFor(booking: Pick<StudioBooking, "hours">) {
  return booking.hours * consultRate;
}

/** Visit plus the usual gap plus anything she added. */
export function blockedMinutes(booking: StudioBooking) {
  if (!isActive(booking)) return 0;
  return booking.hours * 60 + chairBufferMinutes + (booking.extraBufferMinutes ?? 0);
}

export function visitEnd(booking: StudioBooking) {
  return timePlus(booking.time, booking.hours * 60);
}

export function freeFrom(booking: StudioBooking) {
  return timePlus(booking.time, blockedMinutes(booking));
}

export function sortByStart<T extends Pick<StudioBooking, "date" | "time">>(items: T[]) {
  return [...items].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function sortNewestFirst<T extends Pick<StudioBooking, "createdAt">>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------- Weeks and days ---------- */

export function mondayOf(date: string) {
  const dow = weekdayIndex(date);
  return addDays(date, -((dow + 6) % 7));
}

export function weekOf(date: string) {
  const monday = mondayOf(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

export type AgendaItem =
  | { kind: "booking"; booking: StudioBooking }
  | { kind: "hold"; hold: TimeHold }
  | { kind: "free"; start: string; end: string; minutes: number };

export type DayAgenda = {
  date: string;
  hours: DayHours;
  items: AgendaItem[];
  cancelled: StudioBooking[];
  bookedMinutes: number;
};

/** The day as she'd read it off a paper diary: appointments, with the gaps between them spelled out. */
export function dayAgenda(
  date: string,
  bookings: StudioBooking[],
  overrides: DayOverride[],
  holds: TimeHold[] = []
): DayAgenda {
  const hours = dayHours(date, overrides);
  const onDay = bookings.filter((item) => item.date === date);
  const active = sortByStart(onDay.filter(isActive));
  const cancelled = sortByStart(onDay.filter((item) => !isActive(item)));
  const dayHolds = holds
    .filter((item) => item.date === date && holdMinutes(item) > 0)
    .sort((a, b) => a.start.localeCompare(b.start));
  const items: AgendaItem[] = [];
  let bookedMinutes = 0;

  if (hours.closed) {
    for (const booking of active) items.push({ kind: "booking", booking });
    for (const hold of dayHolds) items.push({ kind: "hold", hold });
    return { date, hours, items, cancelled, bookedMinutes: active.reduce((sum, b) => sum + b.hours * 60, 0) };
  }

  let cursor = hours.openHour * 60;
  const close = hours.closeHour * 60;
  const pushFree = (start: number, end: number) => {
    if (end - start < 30) return;
    items.push({ kind: "free", start: minutesToTime(start), end: minutesToTime(end), minutes: end - start });
  };

  const blocks: Array<{ start: number; end: number; item: AgendaItem }> = [
    ...active.map((booking) => ({
      start: timeToMinutes(booking.time),
      end: timeToMinutes(booking.time) + blockedMinutes(booking),
      item: { kind: "booking" as const, booking },
    })),
    ...dayHolds.map((hold) => ({
      start: timeToMinutes(hold.start),
      end: timeToMinutes(hold.end),
      item: { kind: "hold" as const, hold },
    })),
  ].sort((a, b) => a.start - b.start);

  for (const block of blocks) {
    pushFree(cursor, block.start);
    items.push(block.item);
    if (block.item.kind === "booking") bookedMinutes += block.item.booking.hours * 60;
    cursor = Math.max(cursor, block.end);
  }
  pushFree(cursor, close);

  return { date, hours, items, cancelled, bookedMinutes };
}

export function minutesToTime(total: number) {
  const hour = Math.floor(total / 60) % 24;
  const minute = ((total % 60) + 60) % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function minutesNow() {
  const { hour, minute } = londonNow();
  return hour * 60 + minute;
}

export function snapHour(minutes: number, direction: "down" | "up") {
  return direction === "down" ? Math.floor(minutes / 60) * 60 : Math.ceil(minutes / 60) * 60;
}

/** The visible window of a day board: opening hours, stretched to fit anything already booked. */
export function boardRange(date: string, bookings: StudioBooking[], overrides: DayOverride[], holds: TimeHold[] = []) {
  const hours = dayHours(date, overrides);
  let start = (hours.closed ? 9 : hours.openHour) * 60;
  let end = (hours.closed ? 19 : hours.closeHour) * 60;
  for (const booking of bookings) {
    if (booking.date !== date || !isActive(booking)) continue;
    const from = timeToMinutes(booking.time);
    start = Math.min(start, from);
    end = Math.max(end, from + blockedMinutes(booking));
  }
  for (const hold of holds) {
    if (hold.date !== date || holdMinutes(hold) <= 0) continue;
    start = Math.min(start, timeToMinutes(hold.start));
    end = Math.max(end, timeToMinutes(hold.end));
  }
  start = snapHour(start, "down");
  end = snapHour(end, "up");
  if (end <= start) end = start + 60;
  return { start, end };
}

export function weekBoardRange(
  dates: string[],
  bookings: StudioBooking[],
  overrides: DayOverride[],
  holds: TimeHold[] = []
) {
  let start = 24 * 60;
  let end = 0;
  for (const date of dates) {
    const hours = dayHours(date, overrides);
    const has =
      bookings.some((item) => item.date === date && isActive(item)) || holds.some((item) => item.date === date);
    if (hours.closed && !has) continue;
    const range = boardRange(date, bookings, overrides, holds);
    start = Math.min(start, range.start);
    end = Math.max(end, range.end);
  }
  if (end <= start) return { start: 9 * 60, end: 19 * 60 };
  return { start, end };
}

export function boardRows(start: number, end: number, step = 30) {
  const rows: number[] = [];
  for (let t = start; t < end; t += step) rows.push(t);
  return rows;
}

export type ChairBlock = {
  booking: StudioBooking;
  start: number;
  visitMinutes: number;
  bufferMinutes: number;
  /** 1-based CSS grid row. */
  row: number;
  span: number;
};

export function chairBlocks(
  date: string,
  bookings: StudioBooking[],
  rangeStart: number,
  step = 30
): ChairBlock[] {
  return sortByStart(bookings.filter((item) => item.date === date && isActive(item))).map((booking) => {
    const start = timeToMinutes(booking.time);
    const visitMinutes = booking.hours * 60;
    const buffer = chairBufferMinutes + (booking.extraBufferMinutes ?? 0);
    return {
      booking,
      start,
      visitMinutes,
      bufferMinutes: buffer,
      row: Math.floor((start - rangeStart) / step) + 1,
      span: Math.max(1, Math.round((visitMinutes + buffer) / step)),
    };
  });
}

export type HoldBlock = {
  hold: TimeHold;
  start: number;
  minutes: number;
  row: number;
  span: number;
};

export function holdBlocks(date: string, holds: TimeHold[], rangeStart: number, step = 30): HoldBlock[] {
  return holds
    .filter((item) => item.date === date && holdMinutes(item) > 0)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((hold) => {
      const start = timeToMinutes(hold.start);
      const minutes = holdMinutes(hold);
      return {
        hold,
        start,
        minutes,
        row: Math.floor((start - rangeStart) / step) + 1,
        span: Math.max(1, Math.round(minutes / step)),
      };
    });
}

/** Wash on the board so a 3-hour set reads heavier than a tidy hour. */
export function tierWash(hours: number) {
  if (hours >= 3) return "bg-pink";
  if (hours >= 2) return "bg-[#ead4c8]";
  if (hours >= 1.5) return "bg-sky";
  return "bg-muted";
}

export function tierBar(hours: number) {
  if (hours >= 3) return "bg-[#c9a8a2]";
  if (hours >= 2) return "bg-pink";
  if (hours >= 1.5) return "bg-[#9aaeb0]";
  return "bg-ink/35";
}

export type RosterDay = {
  date: string;
  hours: DayHours;
  count: number;
  employee: StudioEmployee | null;
  holds: number;
};

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function whoOn(
  date: string,
  hours: DayHours,
  shifts: Shift[] = [],
  employees: StudioEmployee[] = []
): StudioEmployee | null {
  if (hours.closed) return null;
  const assigned = shifts.find((item) => item.date === date);
  if (assigned) return employees.find((item) => item.id === assigned.employeeId) ?? employees[0] ?? null;
  return employees.find((item) => item.id === DEFAULT_EMPLOYEE_ID) ?? employees[0] ?? null;
}

export function weekRoster(
  dates: string[],
  bookings: StudioBooking[],
  overrides: DayOverride[],
  shifts: Shift[] = [],
  employees: StudioEmployee[] = [],
  holds: TimeHold[] = []
): RosterDay[] {
  return dates.map((date) => {
    const hours = dayHours(date, overrides);
    return {
      date,
      hours,
      count: bookings.filter((item) => item.date === date && isActive(item)).length,
      employee: whoOn(date, hours, shifts, employees),
      holds: holds.filter((item) => item.date === date).length,
    };
  });
}

/* ---------- Clients, derived from bookings ---------- */

export type Client = {
  key: string;
  name: string;
  phone: string;
  email: string;
  /** Every non-cancelled booking, soonest first. */
  visits: StudioBooking[];
  cancelled: number;
  lastVisit?: StudioBooking;
  nextVisit?: StudioBooking;
  photos: string[];
  note?: string;
  /** Latest booking, visit, or cancel — used to order the list. */
  lastActivity: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function clientKey(booking: Pick<StudioBooking, "email" | "phone">) {
  const email = booking.email.trim().toLowerCase();
  return email || `phone:${digits(booking.phone)}`;
}

export function buildClients(bookings: StudioBooking[], notes: ClientNote[] = []): Client[] {
  const noteByKey = new Map(notes.map((item) => [item.key, item.note]));
  const groups = new Map<string, StudioBooking[]>();
  for (const booking of bookings) {
    const key = clientKey(booking);
    groups.set(key, [...(groups.get(key) ?? []), booking]);
  }

  const clients: Client[] = [];
  for (const [key, list] of groups) {
    const newest = sortNewestFirst(list)[0];
    const visits = sortByStart(list.filter(isActive));
    const past = visits.filter(isPast);
    const upcoming = visits.filter((item) => !isPast(item));
    clients.push({
      key,
      name: newest.name,
      phone: newest.phone,
      email: newest.email,
      visits,
      cancelled: list.length - visits.length,
      lastVisit: past[past.length - 1],
      nextVisit: upcoming[0],
      photos: visits.map((item) => item.nailPhotoUrl).filter((url): url is string => Boolean(url)),
      note: noteByKey.get(key),
      lastActivity: list.reduce((max, item) => {
        const stamp = item.updatedAt && item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt;
        return stamp > max ? stamp : max;
      }, ""),
    });
  }

  return clients.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}

export function searchClients(clients: Client[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return clients;
  const qDigits = digits(q);
  return clients.filter(
    (client) =>
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && digits(client.phone).includes(qDigits))
  );
}

export function clientsByLetter(clients: Client[]) {
  const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }));
  const groups: { letter: string; items: Client[] }[] = [];
  for (const client of sorted) {
    const raw = client.name.trim().charAt(0).toUpperCase();
    const letter = raw >= "A" && raw <= "Z" ? raw : "#";
    const last = groups[groups.length - 1];
    if (last?.letter === letter) last.items.push(client);
    else groups.push({ letter, items: [client] });
  }
  return groups;
}

/* ---------- Money ---------- */

export type WeekSummary = {
  bookings: number;
  hours: number;
  depositsDue: { count: number; amount: number };
  taken: number;
};

export function weekSummary(bookings: StudioBooking[], dates: string[]): WeekSummary {
  const inWeek = bookings.filter((item) => isActive(item) && dates.includes(item.date));
  const due = inWeek.filter((item) => !item.depositPaid);
  return {
    bookings: inWeek.length,
    hours: inWeek.reduce((sum, item) => sum + item.hours, 0),
    depositsDue: { count: due.length, amount: due.reduce((sum, item) => sum + depositFor(item), 0) },
    taken: inWeek.reduce((sum, item) => sum + (item.chargedOnDay ?? 0), 0),
  };
}

/* ---------- Contact ---------- */

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/** UK mobiles: 07… becomes 447… */
export function whatsappHref(phone: string) {
  let number = digits(phone);
  if (number.startsWith("0")) number = `44${number.slice(1)}`;
  return `https://wa.me/${number}`;
}

/* ---------- Tags, the small coloured labels on a booking ---------- */

export type Tone = "ink" | "pink" | "sky" | "muted" | "line";
export type Tag = { label: string; tone: Tone };

export function bookingTags(booking: StudioBooking): Tag[] {
  if (!isActive(booking)) return [{ label: "Cancelled", tone: "muted" }];
  const tags: Tag[] = [];
  if (isPast(booking)) {
    tags.push({ label: "Done", tone: "muted" });
    tags.push(
      booking.chargedOnDay != null
        ? { label: `£${booking.chargedOnDay} taken`, tone: "sky" }
        : { label: "Add takings", tone: "pink" }
    );
    return tags;
  }
  if (isNew(booking)) tags.push({ label: "New", tone: "ink" });
  tags.push(booking.depositPaid ? { label: "Deposit paid", tone: "sky" } : { label: "Deposit due", tone: "pink" });
  if (booking.status === "updated") tags.push({ label: "Updated", tone: "line" });
  return tags;
}

export function todayDate() {
  return todayKey();
}
