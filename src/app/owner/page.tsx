import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { isOwnerKey } from "@/lib/owner";
import { chairBufferMinutes, extraBufferChoices, formatClockTime, prettyDay, tierTitle, timePlus } from "@/lib/hours";
import { listBookings, listPrivateFeedback, type StudioBooking } from "@/lib/server-store";
import { bookingIsPast } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Manager — Jibbynails",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function ownerHref(key: string, view?: "notes") {
  const params = new URLSearchParams({ key });
  if (view) params.set("view", view);
  return `/owner?${params.toString()}`;
}

function banner(code: string) {
  if (code === "overlap") return "That extra buffer runs into the next client. Pick a shorter one.";
  if (code === "missing") return "That booking is already gone.";
  if (code === "confirm") return "Tick the box to cancel a booking.";
  if (code === "buffer") return "Pick one of the buffer lengths.";
  return "";
}

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const key = first(raw.key);
  if (!isOwnerKey(key)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 text-center">
          <h1 className="font-heading text-[2.8rem] leading-none">Manager</h1>
          <p className="mt-3 text-sm tracking-wide text-muted-foreground">
            Add the owner key to the URL to manage bookings.
          </p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const view = first(raw.view) === "notes" ? "notes" : "bookings";
  const message = first(raw.saved) ? "Saved. They’ll see it on their booking." : banner(first(raw.err));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-8 pt-8">
        <p className="eyebrow">Manager</p>
        <h1 className="font-heading mt-2 text-[2.8rem] leading-none">
          {view === "notes" ? "Private notes" : "Bookings"}
        </h1>
        <div className="mt-4 flex gap-2">
          <Link
            href={ownerHref(key)}
            className={cn(
              "press rounded-full px-4 py-2 text-sm",
              view === "bookings" ? "bg-ink text-primary-foreground" : "border border-ink/15"
            )}
          >
            Bookings
          </Link>
          <Link
            href={ownerHref(key, "notes")}
            className={cn(
              "press rounded-full px-4 py-2 text-sm",
              view === "notes" ? "bg-ink text-primary-foreground" : "border border-ink/15"
            )}
          >
            Private notes
          </Link>
        </div>
        {message ? <p className="mt-4 rounded-full bg-sky px-4 py-2 text-sm">{message}</p> : null}
        {view === "notes" ? <Notes /> : <Bookings ownerKey={key} />}
      </main>
      <BottomNav />
    </div>
  );
}

async function Bookings({ ownerKey }: { ownerKey: string }) {
  const bookings = [...(await listBookings())].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );
  const active = bookings.filter((item) => item.status !== "cancelled");
  const upcoming = active.filter((item) => !bookingIsPast(item.date, item.time, item.hours));
  const past = active.filter((item) => bookingIsPast(item.date, item.time, item.hours)).reverse();
  const cancelled = bookings.filter((item) => item.status === "cancelled").reverse();

  return (
    <>
      <p className="mt-3 text-sm tracking-wide text-muted-foreground">
        Each booking is the tier they picked. {chairBufferMinutes} minutes after is already blocked. Add more time
        here and they’ll see it on their booking.
      </p>
      <BookingList title="Upcoming" items={upcoming} ownerKey={ownerKey} empty="No upcoming bookings." />
      <BookingList title="Past" items={past} ownerKey={ownerKey} empty="No past bookings." />
      <BookingList title="Cancelled" items={cancelled} ownerKey={ownerKey} empty="No cancelled bookings." />
    </>
  );
}

function BookingList({
  title,
  items,
  ownerKey,
  empty,
}: {
  title: string;
  items: StudioBooking[];
  ownerKey: string;
  empty: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-[2rem] leading-none">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <BookingCard key={item.id} booking={item} ownerKey={ownerKey} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingCard({ booking, ownerKey }: { booking: StudioBooking; ownerKey: string }) {
  const extra = booking.extraBufferMinutes ?? 0;
  const serviceEnd = timePlus(booking.time, booking.hours * 60);
  const bufferEnd = timePlus(booking.time, booking.hours * 60 + chairBufferMinutes + extra);
  const cancelled = booking.status === "cancelled";

  return (
    <li className="surface rounded-3xl p-4">
      <p className="text-sm font-medium">
        {prettyDay(booking.date)} · {formatClockTime(booking.time)}
      </p>
      <p className="mt-1 text-sm">{tierTitle(booking.hours)}</p>
      <p className="mt-1 text-sm">
        {booking.name}
        {cancelled ? <span className="ml-2 text-xs text-muted-foreground">Cancelled</span> : null}
        {!cancelled && booking.status === "updated" ? (
          <span className="ml-2 text-xs text-muted-foreground">Updated</span>
        ) : null}
      </p>
      <p className="mt-2 text-sm">
        <a className="underline" href={`tel:${booking.phone.replace(/\s+/g, "")}`}>
          {booking.phone}
        </a>
        <span className="text-muted-foreground"> · </span>
        <a className="underline" href={`mailto:${booking.email}`}>
          {booking.email}
        </a>
      </p>
      <p className="mt-3 text-sm leading-6">{booking.inspo || "No details yet."}</p>
      {booking.nailPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={booking.nailPhotoUrl} alt="" className="mt-3 max-h-56 w-full rounded-2xl object-cover" />
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No nail photo.</p>
      )}
      {!cancelled ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Chair {formatClockTime(booking.time)}–{formatClockTime(serviceEnd)}. Free until{" "}
          {formatClockTime(bufferEnd)} to message them.
        </p>
      ) : null}
      {booking.updateNote ? <p className="mt-3 rounded-2xl bg-sky px-3 py-2 text-sm">{booking.updateNote}</p> : null}
      {cancelled ? null : (
        <>
          <form action="/api/owner/booking" method="post" className="mt-4 space-y-3">
            <input type="hidden" name="key" value={ownerKey} />
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="action" value="update" />
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
              Extra buffer
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
          <form action="/api/owner/booking" method="post" className="mt-4 space-y-3 border-t border-ink/8 pt-4">
            <input type="hidden" name="key" value={ownerKey} />
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="action" value="cancel" />
            <label className="block text-sm">
              Cancellation note
              <textarea
                name="note"
                rows={2}
                placeholder="Optional — they see this if you cancel"
                className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
              />
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="confirm" value="1" required className="mt-1 size-4" />
              Cancel and free the slot
            </label>
            <button type="submit" className="press h-11 w-full rounded-full border border-ink/20 text-sm">
              Cancel booking
            </button>
          </form>
        </>
      )}
    </li>
  );
}

async function Notes() {
  const notes = await listPrivateFeedback();
  if (notes.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No private notes yet.</p>;
  return (
    <ul className="mt-8 space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="surface overflow-hidden rounded-3xl p-4">
          <p className="text-sm tracking-wide">
            {"★".repeat(note.rating)}
            <span className="text-ink/20">{"★".repeat(5 - note.rating)}</span>
            <span className="ml-2 text-xs text-muted-foreground">{note.name}</span>
          </p>
          <p className="mt-3 text-sm leading-6">{note.text}</p>
          {note.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={note.photoUrl} alt="" className="mt-3 max-h-56 w-full rounded-2xl object-cover" />
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleString("en-GB")}
            {note.visitId ? ` · ${note.visitId}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
