import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Banner } from "@/components/manager/banner";
import { BookingRow } from "@/components/manager/booking-row";
import { buildClients, clientKey, isPast, sortByStart, telHref, whatsappHref } from "@/lib/manager";
import { requireOwner } from "@/lib/owner";
import { formatMoney } from "@/lib/pricing";
import { listBookings, listClientNotes } from "@/lib/server-store";

export const metadata = {
  title: "Client — Manager",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ClientPage({ params, searchParams }: PageProps<"/owner/clients/[key]">) {
  await requireOwner();
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey).toLowerCase();
  const raw = await searchParams;
  const [bookings, notes] = await Promise.all([listBookings(), listClientNotes()]);
  const client = buildClients(bookings, notes).find((item) => item.key === key);
  if (!client) notFound();

  const upcoming = client.visits.filter((item) => !isPast(item));
  const past = client.visits.filter(isPast).reverse();
  const cancelled = sortByStart(bookings.filter((item) => item.status === "cancelled" && clientKey(item) === key)).reverse();
  const spent = past.reduce((sum, item) => sum + (item.chargedOnDay ?? 0), 0);

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8 lg:max-w-3xl">
      <Link href="/owner/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <h1 className="font-heading mt-4 text-[2.8rem] leading-none">{client.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {client.visits.length} {client.visits.length === 1 ? "visit" : "visits"}
        {client.cancelled ? ` · ${client.cancelled} cancelled` : ""}
        {spent ? ` · ${formatMoney(spent)} taken` : ""}
      </p>
      <Banner message={first(raw.saved) ? "Note saved." : undefined} />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <a href={telHref(client.phone)} className="press flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-sm text-card">
          <Phone className="size-4" /> Call
        </a>
        <a
          href={whatsappHref(client.phone)}
          target="_blank"
          rel="noreferrer"
          className="press flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm"
        >
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        <a href={`mailto:${client.email}`} className="press flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm">
          <Mail className="size-4" /> Email
        </a>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {client.phone} · {client.email}
      </p>

      <section className="surface mt-6 rounded-3xl p-4">
        <p className="eyebrow">Your note on them</p>
        <form action="/api/owner/client" method="post" className="mt-3 space-y-3">
          <input type="hidden" name="key" value={client.key} />
          <textarea
            name="note"
            rows={3}
            defaultValue={client.note}
            placeholder="Allergies, how they like their shape, anything to remember"
            className="w-full rounded-3xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <button type="submit" className="press h-11 w-full rounded-full border border-ink text-sm font-medium">
            Save note
          </button>
        </form>
      </section>

      {client.photos.length > 0 ? (
        <section className="mt-6">
          <p className="eyebrow">Their sets</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {client.photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <History title="Coming up" items={upcoming} empty="Nothing booked." />
      <History title="Past" items={past} empty="No past visits yet." />
      {cancelled.length > 0 ? <History title="Cancelled" items={cancelled} /> : null}
    </main>
  );
}

function History({
  title,
  items,
  empty,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listBookings>>;
  empty?: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-heading text-[2rem] leading-none">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((booking) => (
            <li key={booking.id}>
              <BookingRow booking={booking} showDay />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
