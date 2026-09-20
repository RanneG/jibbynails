import type { Booking, Draft, Review } from "./types";
import { emptyDraft } from "./types";

const BOOKINGS = "jibby.bookings";
const REVIEWS = "jibby.reviews";
const DRAFT = "jibby.draft";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota — keep going in memory
  }
}

export function loadBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS, []);
}

export function saveBooking(booking: Booking) {
  const next = [booking, ...loadBookings().filter((item) => item.id !== booking.id)];
  write(BOOKINGS, next);
  return next;
}

export function getBooking(id: string) {
  return loadBookings().find((item) => item.id === id);
}

export function loadReviews(): Review[] {
  return read<Review[]>(REVIEWS, []);
}

export function saveReview(review: Review) {
  const next = [review, ...loadReviews().filter((item) => item.id !== review.id)];
  write(REVIEWS, next);
  return next;
}

export function loadDraft(): Draft {
  return { ...emptyDraft(), ...read<Partial<Draft>>(DRAFT, {}) };
}

export function saveDraft(draft: Draft) {
  write(DRAFT, draft);
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT);
  } catch {
    // ignore
  }
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

