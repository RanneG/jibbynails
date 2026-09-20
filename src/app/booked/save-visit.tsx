"use client";

import { useEffect } from "react";
import { saveBooking } from "@/lib/storage";
import type { Booking, Draft, Quote } from "@/lib/types";

export function SaveVisit({ id, draft, quote }: { id?: string; draft: Draft; quote: Quote }) {
  useEffect(() => {
    const booking: Booking = {
      id: id || `visit_${draft.date}_${draft.time}`.replace(/\W/g, ""),
      createdAt: new Date().toISOString(),
      draft,
      quote,
      status: "confirmed",
    };
    saveBooking(booking);
  }, [id, draft, quote]);
  return null;
}
