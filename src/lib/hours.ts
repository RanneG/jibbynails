import { studio } from "./studio";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function londonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday");
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dow: map[weekday] ?? 0,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function isOpenDay(dow: number) {
  return studio.openDays.includes(dow);
}

export function formatClock(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
}

export function hoursRange() {
  return `${formatClock(studio.openHour)} – ${formatClock(studio.closeHour)}`;
}

export function typicalHoursLabel() {
  return `Sun, Mon, Tue, Thu · ${hoursRange()}`;
}

export function formatClockTime(hhmm: string) {
  const [hourPart, minutePart] = hhmm.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart || 0);
  if (Number.isNaN(hour)) return hhmm;
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function prettyDay(isoDate: string) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00`));
}

export type DayRow = {
  dow: number;
  name: string;
  hours: string;
  closed: boolean;
  isToday: boolean;
};

export function weekFromToday(): DayRow[] {
  const { dow } = londonNow();
  return Array.from({ length: 7 }, (_, offset) => {
    const day = (dow + offset) % 7;
    const closed = !isOpenDay(day);
    return {
      dow: day,
      name: DAYS[day],
      hours: closed ? "Closed" : hoursRange(),
      closed,
      isToday: offset === 0,
    };
  });
}

export function openingStatus() {
  const now = londonNow();
  const openStart = studio.openHour * 60;
  const openEnd = studio.closeHour * 60;
  const todayOpen = isOpenDay(now.dow);
  const isOpen = todayOpen && now.minutes >= openStart && now.minutes < openEnd;

  if (isOpen) {
    return {
      open: true,
      label: "Open now",
      next: `Closes ${formatClock(studio.closeHour)}`,
    };
  }

  if (todayOpen && now.minutes < openStart) {
    return {
      open: false,
      label: "Closed now",
      next: `Opens today ${formatClock(studio.openHour)}`,
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (now.dow + offset) % 7;
    if (!isOpenDay(day)) continue;
    const when = offset === 1 ? "tomorrow" : DAYS[day];
    return {
      open: false,
      label: "Closed now",
      next: `Opens ${when} ${formatClock(studio.openHour)}`,
    };
  }

  return { open: false, label: "Closed now", next: "Check back soon" };
}

export const consultRate = 15;

export const consultLengths = [
  { hours: 1, label: "1 hour", price: 15 },
  { hours: 1.5, label: "1½ hours", price: 22.5 },
  { hours: 2, label: "2 hours", price: 30 },
  { hours: 2.5, label: "2½ hours", price: 37.5 },
  { hours: 3, label: "3 hours", price: 45 },
] as const;
