"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { quoteDraft } from "./pricing";
import {
  clearDraft,
  getBooking,
  loadBookings,
  loadDraft,
  loadReviews,
  newId,
  saveBooking,
  saveDraft,
  saveReview,
} from "./storage";
import type { Booking, Draft, Review } from "./types";
import { emptyDraft } from "./types";

type Snap = {
  draft: Draft;
  bookings: Booking[];
  reviews: Review[];
  ready: boolean;
};

type Store = Snap & {
  updateDraft: (patch: Partial<Draft>) => Draft;
  resetDraft: () => void;
  confirmBooking: () => Booking;
  addReview: (input: Omit<Review, "id" | "createdAt">) => Review;
  findBooking: (id: string) => Booking | undefined;
};

const StoreContext = createContext<Store | null>(null);

const emptySnap: Snap = {
  draft: emptyDraft(),
  bookings: [],
  reviews: [],
  ready: false,
};

let snap: Snap = emptySnap;
let scheduled = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function write(next: Snap) {
  snap = next;
  emit();
}

function hydrate() {
  if (snap.ready || typeof window === "undefined") return;
  snap = {
    draft: loadDraft(),
    bookings: loadBookings(),
    reviews: loadReviews(),
    ready: true,
  };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(hydrate);
  }
  return () => listeners.delete(listener);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, () => snap, () => emptySnap);

  const updateDraft = useCallback((patch: Partial<Draft>) => {
    const draft = { ...snap.draft, ...patch };
    saveDraft(draft);
    write({ ...snap, draft, ready: true });
    return draft;
  }, []);

  const resetDraft = useCallback(() => {
    clearDraft();
    write({ ...snap, draft: emptyDraft(), ready: true });
  }, []);

  const confirmBooking = useCallback(() => {
    const booking: Booking = {
      id: newId("visit"),
      createdAt: new Date().toISOString(),
      draft: snap.draft,
      quote: quoteDraft(snap.draft),
      status: "confirmed",
    };
    const bookings = saveBooking(booking);
    clearDraft();
    write({ draft: emptyDraft(), bookings, reviews: snap.reviews, ready: true });
    return booking;
  }, []);

  const addReview = useCallback((input: Omit<Review, "id" | "createdAt">) => {
    const review: Review = {
      ...input,
      id: newId("rev"),
      createdAt: new Date().toISOString(),
    };
    write({ ...snap, reviews: saveReview(review), ready: true });
    return review;
  }, []);

  const findBooking = useCallback((id: string) => getBooking(id), []);

  const value = useMemo<Store>(
    () => ({
      ...current,
      updateDraft,
      resetDraft,
      confirmBooking,
      addReview,
      findBooking,
    }),
    [addReview, confirmBooking, current, findBooking, resetDraft, updateDraft]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
