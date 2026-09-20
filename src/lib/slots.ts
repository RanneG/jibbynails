import { studio } from "./studio";

export type DaySlots = {
  date: string;
  label: string;
  weekday: string;
  closed: boolean;
  times: string[];
};

export type OccupiedSlot = {
  date: string;
  time: string;
  hours: number;
};

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function todayKey() {
  const p = londonParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  const p = londonParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function weekdayIndex(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function weekdayName(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function timeToMinutes(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
) {
  return aStart < bEnd && bStart < aEnd;
}

export function slotConflicts(
  date: string,
  time: string,
  hours: number,
  occupied: OccupiedSlot[]
) {
  const start = timeToMinutes(time);
  const end = start + hours * 60;
  return occupied.some((item) => {
    if (item.date !== date) return false;
    const otherStart = timeToMinutes(item.time);
    return rangesOverlap(start, end, otherStart, otherStart + item.hours * 60);
  });
}

function timesForDate(date: string, minutes: number, occupied: OccupiedSlot[]) {
  const duration = Math.max(minutes || 60, 30);
  const dow = weekdayIndex(date);
  if (!studio.openDays.includes(dow)) return [];

  const now = londonParts(new Date());
  const today = todayKey();
  if (date < today) return [];
  const hours = duration / 60;
  const lastStart = studio.closeHour * 60 - duration;
  const times: string[] = [];

  for (let t = studio.openHour * 60; t <= lastStart; t += 30) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    if (date === today && (hour < now.hour || (hour === now.hour && minute <= now.minute))) {
      continue;
    }
    const stamp = `${pad(hour)}:${pad(minute)}`;
    if (slotConflicts(date, stamp, hours, occupied)) continue;
    times.push(stamp);
  }

  return times;
}

export function daySlots(date: string, minutes: number, occupied: OccupiedSlot[] = []): DaySlots {
  const closed = !studio.openDays.includes(weekdayIndex(date));
  return {
    date,
    label: prettyDate(date),
    weekday: weekdayName(date),
    closed,
    times: closed ? [] : timesForDate(date, minutes, occupied),
  };
}

export function generateDays(minutes: number, count = 16, occupied: OccupiedSlot[] = []): DaySlots[] {
  const start = todayKey();
  return Array.from({ length: count }, (_, i) => daySlots(addDays(start, i), minutes, occupied));
}

export function generateMonth(
  year: number,
  month: number,
  minutes: number,
  occupied: OccupiedSlot[] = []
) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${year}-${pad(month)}-${pad(i + 1)}`;
    return daySlots(date, minutes, occupied);
  });
}

export function monthMatrix(year: number, month: number) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function nextAvailable(minutes: number, occupied: OccupiedSlot[] = [], after?: string) {
  const start = after && after > todayKey() ? after : todayKey();
  for (let i = 0; i < 90; i += 1) {
    const date = addDays(start, i);
    const day = daySlots(date, minutes, occupied);
    if (!day.closed && day.times.length > 0) return day;
  }
  return null;
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function shiftMonth(yearMonth: string, delta: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function bookingIsPast(date: string, time: string, hours: number) {
  const today = todayKey();
  if (date < today) return true;
  if (date > today) return false;
  const now = londonParts(new Date());
  return timeToMinutes(time) + hours * 60 <= now.hour * 60 + now.minute;
}
