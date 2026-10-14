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
/** Kept free after every booking so she can message the client. */
export const chairBufferMinutes = 30;
export const extraBufferChoices = [0, 15, 30, 45] as const;

/**
 * Bookable chair times.
 * `price` is the deposit (`hours * consultRate`).
 * `setRange` is the set on the day, low to high for what that tier usually includes.
 */
export const consultLengths = [
  {
    hours: 1,
    tier: "Tier 0",
    name: "Solid or Colour",
    label: "1 hour",
    price: 15,
    setRange: "£27–£32",
    detail: "One solid colour or a simple colour. No art, and not a soak off with a new set.",
    includes: ["One colour from her rack", "Overlay, infill, or a plain full set", "No art, no soak off with a new set"],
  },
  {
    hours: 1.5,
    tier: "Tier 1",
    name: "Cute & Simple set",
    label: "1½ hours",
    price: 22.5,
    setRange: "£35–£50",
    detail: "French, a little art, or a straightforward shape.",
    includes: ["French, ombré, or a tip line", "A little art on a few nails", "Small charms or a simple shape change"],
  },
  {
    hours: 2,
    tier: "Tier 2",
    name: "Sweet & Spicy set",
    label: "2 hours",
    price: 30,
    setRange: "£35–£75",
    detail: "More art, charms, or a soak off with a new set.",
    includes: ["Art on most nails, charms, pearls", "Longer sets with a design", "Soak off with a new set"],
  },
  {
    hours: 3,
    tier: "Tier 3",
    name: "Masterpiece set",
    label: "3 hours",
    price: 45,
    setRange: "£50–£90",
    detail: "Intricate art, a recreate, or XXL that needs the whole chair.",
    includes: ["3D bows, characters, and textures", "Hand-painted art across the set", "Recreates and XXL"],
  },
] as const;

export type ConsultLength = (typeof consultLengths)[number];

export function consultByHours(hours: number) {
  return consultLengths.find((item) => item.hours === hours);
}

export function durationLabel(hours: number) {
  const tier = consultByHours(hours);
  if (tier) return tier.label;
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}

export function tierTitle(hours: number) {
  const tier = consultByHours(hours);
  if (!tier) return durationLabel(hours);
  return `${tier.tier} · ${tier.name} · ${tier.label}`;
}

export function timePlus(hhmm: string, minutes: number) {
  const [hourPart, minutePart] = hhmm.split(":");
  const total = Number(hourPart) * 60 + Number(minutePart || 0) + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = ((total % 60) + 60) % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
