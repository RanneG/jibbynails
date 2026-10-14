import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Banner } from "@/components/manager/banner";
import { Tags } from "@/components/manager/tag";
import { chairBufferMinutes, extraBufferChoices, formatClockTime, prettyDay, tierTitle } from "@/lib/hours";
import {
  bookingTags,
  clientKey,
  depositFor,
  freeFrom,
  isActive,
  isPast,
  telHref,
  visitEnd,
  whatsappHref,
} from "@/lib/manager";
import { requireOwner } from "@/lib/owner";
import { formatMoney } from "@/lib/pricing";
import { findBooking, listBookings, markBookingSeen } from "@/lib/server-store";

export const metadata = {
  title: "Booking — Manager",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function message(saved: string, err: string) {
  if (saved === "client") return { text: "Saved. They’ll see it on their booking.", tone: "ok" as const };
  if (saved === "private") return { text: "Saved. Only you see this.", tone: "ok" as const };
  if (saved === "cancelled") return { text: "Cancelled. The slot is free again.", tone: "ok" as const };
  if (err === "overlap") return { text: "That extra buffer runs into the next client. Pick a shorter one.", tone: "warn" as const };
  if (err === "missing") return { text: "That booking is already gone.", tone: "warn" as const };
  if (err === "confirm") return { text: "Tick the box to cancel.", tone: "warn" as const };
  if (err === "buffer") return { text: "Pick one of the buffer lengths.", tone: "warn" as const };
  if (err === "charged") return { text: "Enter the amount as a number, like 65.", tone: "warn" as const };
  return null;
}

export default async function OwnerBookingPage({ params, searchParams }: PageProps<"/owner/booking/[id]">) {
  await requireOwner();
  const { id } = await params;
  const raw = await searchParams;
  const found = await findBooking(id);
  if (!found) notFound();
  if (!found.ownerSeenAt) await markBookingSeen(id);
  const booking = { ...found, ownerSeenAt: found.ownerSeenAt ?? new Date().toISOString() };

  const all = await listBookings();
  const key = clientKey(booking);
  const theirs = all.filter((item) => isActive(item) && clientKey(item) === key);
  const visitNumber = theirs.filter((item) => `${item.date}${item.time}` <= `${booking.date}${booking.time}`).length;

  const active = isActive(booking);
  const past = isPast(booking);
  const extra = booking.extraBufferMinutes ?? 0;
  const note = message(first(raw.saved), first(raw.err));
  const back = `/owner/booking/${booking.id}`;

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8 lg:max-w-3xl">
      <Link
        href={`/owner/schedule?date=${booking.date}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {prettyDay(booking.date)}
      </Link>

      <div className="mt-4">
        <Tags tags={bookingTags(booking)} />
      </div>
      <h1 className="font-heading mt-3 text-[2.8rem] leading-none">
        {prettyDay(booking.date)}
        <br />
        {formatClockTime(booking.time)}–{formatClockTime(visitEnd(booking))}
      </h1>
      <p className="mt-3 text-sm">{tierTitle(booking.hours)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Deposit {formatMoney(depositFor(booking))} · balance in cash on the day
      </p>
      <Banner message={note?.text} tone={note?.tone} />

      {/* Who */}
      <section className="surface mt-6 rounded-3xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-medium leading-tight">{booking.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {visitNumber === 1 ? "First visit" : `Visit ${visitNumber}`}
              {theirs.length > 1 ? ` of ${theirs.length}` : ""}
            </p>
          </div>
          <Link
            href={`/owner/clients/${encodeURIComponent(key)}`}
            className="press shrink-0 rounded-full border border-ink/15 px-3 py-1.5 text-xs"
          >
            History
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={telHref(booking.phone)} className="press flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-sm text-card">
            <Phone className="size-4" /> Call
          </a>
          <a
            href={whatsappHref(booking.phone)}
            target="_blank"
            rel="noreferrer"
            className="press flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a href={`mailto:${booking.email}`} className="press flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm">
            <Mail className="size-4" /> Email
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {booking.phone} · {booking.email}
        </p>
      </section>

      {/* The brief */}
      <section className="mt-6">
        <p className="eyebrow">What they want</p>
        <p className="mt-2 text-sm leading-6">{booking.inspo || "No details yet."}</p>
        {booking.nailPhotoUrl ? (
          <a href={booking.nailPhotoUrl} target="_blank" rel="noreferrer" className="mt-3 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={booking.nailPhotoUrl} alt="Nails sent with this booking" className="max-h-80 w-full rounded-3xl object-cover" />
          </a>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No nail photo.</p>
        )}
        {booking.updateNote ? (
          <div className="mt-4 rounded-2xl bg-sky px-4 py-3 text-sm leading-6">
            <p className="text-[11px] tracking-wide text-muted-foreground">
              {active ? "They can see this" : "Sent with the cancellation"}
            </p>
            <p className="mt-1">{booking.updateNote}</p>
          </div>
        ) : null}
      </section>

      {/* The chair, and what the client sees */}
      {active && !past ? (
        <section className="surface mt-6 rounded-3xl p-4">
          <p className="eyebrow">Chair</p>
          <p className="mt-2 text-sm leading-6">
            On the chair {formatClockTime(booking.time)}–{formatClockTime(visitEnd(booking))}. Blocked until{" "}
            {formatClockTime(freeFrom(booking))}
            {extra ? ` (usual ${chairBufferMinutes} min + ${extra} you added)` : ` (usual ${chairBufferMinutes} min)`}.
          </p>
          <form action="/api/owner/booking" method="post" className="mt-4 space-y-3">
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="back" value={back} />
            <label className="block text-sm">
              Message they’ll see
              <textarea
                name="note"
                rows={3}
                defaultValue={booking.updateNote}
                placeholder="Running 20 minutes late — still come at your time"
                className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
              />
            </label>
            <label className="block text-sm">
              Extra time after
              <select
                name="buffer"
                defaultValue={String(extra)}
                className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
              >
                {extraBufferChoices.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 0 ? `Just the usual ${chairBufferMinutes} min` : `+${minutes} min after the slot`}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-gold w-full">
              Update client
            </button>
          </form>
        </section>
      ) : null}

      {/* Only Jibby sees this */}
      {active ? (
        <section className="surface mt-6 rounded-3xl p-4">
          <p className="eyebrow">Only you see this</p>
          <form action="/api/owner/booking" method="post" className="mt-3 space-y-3">
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="action" value="private" />
            <input type="hidden" name="back" value={back} />
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-sm">
              <span>
                Deposit {formatMoney(depositFor(booking))} paid
                <span className="block text-xs text-muted-foreground">Untick if it hasn’t landed yet</span>
              </span>
              <input type="checkbox" name="deposit" value="1" defaultChecked={Boolean(booking.depositPaid)} className="size-5" />
            </label>
            <label className="block text-sm">
              Charged on the day
              <span className="mt-1.5 flex h-12 items-center rounded-full border border-input bg-card px-4 focus-within:border-ink">
                <span className="text-muted-foreground">£</span>
                <input
                  name="charged"
                  inputMode="decimal"
                  defaultValue={booking.chargedOnDay ?? ""}
                  placeholder={past ? "What did the set come to?" : "Fill in after the visit"}
                  className="h-full w-full bg-transparent pl-1 outline-none"
                />
              </span>
            </label>
            <label className="block text-sm">
              Your note
              <textarea
                name="note"
                rows={2}
                defaultValue={booking.ownerNote}
                placeholder="Allergic to acetone · wants shorter next time"
                className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
              />
            </label>
            <button type="submit" className="press h-12 w-full rounded-full border border-ink text-sm font-medium">
              Save
            </button>
          </form>
        </section>
      ) : null}

      {active && !past ? (
        <details className="mt-6 rounded-3xl border border-ink/10 px-4 py-3">
          <summary className="cursor-pointer list-none text-sm text-muted-foreground">Cancel this booking…</summary>
          <form action="/api/owner/booking" method="post" className="mt-3 space-y-3">
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="action" value="cancel" />
            <input type="hidden" name="back" value={back} />
            <label className="block text-sm">
              Note they’ll see
              <textarea
                name="note"
                rows={2}
                placeholder="Optional — why, and how to rebook"
                className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
              />
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="confirm" value="1" required className="mt-1 size-4" />
              Cancel and free the slot
            </label>
            <button type="submit" className="press h-11 w-full rounded-full border border-destructive/40 text-sm text-destructive">
              Cancel booking
            </button>
          </form>
        </details>
      ) : null}

      <p className="mt-6 text-xs text-muted-foreground">
        Booked {new Date(booking.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        {booking.updatedAt
          ? ` · changed ${new Date(booking.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
          : ""}
      </p>
    </main>
  );
}
