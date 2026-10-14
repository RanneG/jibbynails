import { bookHref } from "./booking-url";
import { consultByHours, type ConsultLength } from "./hours";
import { studio } from "./studio";

export type SetShot = (typeof studio.gallery)[number];

/** Tier 0 has no photo on purpose: it is one plain colour, so we show colours. */
export const tierSwatches = [
  { name: "Nude pink", hex: "#efd3cb" },
  { name: "Cherry", hex: "#b4303a" },
  { name: "Milk", hex: "#f3ede4" },
  { name: "Black", hex: "#1c1c1c" },
  { name: "Sage", hex: "#b7c4b2" },
  { name: "Baby blue", hex: "#bccfe2" },
] as const;

export function shotsForTier(hours: number): SetShot[] {
  return studio.gallery.filter((shot) => shot.hours === hours);
}

export function coverForTier(hours: number): SetShot | undefined {
  return shotsForTier(hours)[0];
}

export function tierAnchor(tier: ConsultLength) {
  return `tier-${tier.tier.replace(/\D/g, "")}`;
}

export function setsHref(tier: ConsultLength) {
  return `/sets#${tierAnchor(tier)}`;
}

export function setsHrefForHours(hours: number) {
  const tier = consultByHours(hours);
  return tier ? setsHref(tier) : "/sets";
}

/** Straight to the calendar for this tier. The tier step is already answered. */
export function bookTierHref(tier: ConsultLength) {
  return bookHref({ hours: tier.hours, step: "when" });
}
