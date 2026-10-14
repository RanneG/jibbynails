import Link from "next/link";
import { Search } from "lucide-react";
import { formatClockTime, prettyDay } from "@/lib/hours";
import { buildClients, clientsByLetter, searchClients, type Client } from "@/lib/manager";
import { requireOwner } from "@/lib/owner";
import { listBookings, listClientNotes } from "@/lib/server-store";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Clients — Manager",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ClientsPage({ searchParams }: PageProps<"/owner/clients">) {
  await requireOwner();
  const raw = await searchParams;
  const query = first(raw.q);
  const byName = first(raw.sort) === "name";
  const [bookings, notes] = await Promise.all([listBookings(), listClientNotes()]);
  const all = buildClients(bookings, notes);
  const clients = searchClients(all, query);
  const groups = byName && !query ? clientsByLetter(clients) : null;

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8">
      <h1 className="font-heading text-[2.8rem] leading-none">Clients</h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground">
        {all.length === 1 ? "1 person" : `${all.length} people`} have booked.
        {byName ? " A–Z." : " Newest activity first."}
      </p>

      <form action="/owner/clients" method="get" role="search" className="mt-4">
        {byName ? <input type="hidden" name="sort" value="name" /> : null}
        <label className="flex h-12 items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-ink">
          <Search className="size-4 text-muted-foreground" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Name, email, or mobile"
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </label>
      </form>

      <div className="mt-3 flex gap-1 rounded-full border border-ink/15 p-1 w-fit">
        <Link
          href={query ? `/owner/clients?q=${encodeURIComponent(query)}` : "/owner/clients"}
          className={cn("press rounded-full px-4 py-1.5 text-sm", !byName ? "bg-ink text-card" : "text-muted-foreground")}
        >
          Recent
        </Link>
        <Link
          href={query ? `/owner/clients?sort=name&q=${encodeURIComponent(query)}` : "/owner/clients?sort=name"}
          className={cn("press rounded-full px-4 py-1.5 text-sm", byName ? "bg-ink text-card" : "text-muted-foreground")}
        >
          A–Z
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {query ? "Nobody matches that." : "Clients appear here once someone books."}
        </p>
      ) : groups ? (
        <div className="mt-4 lg:flex lg:gap-6">
          <div className="min-w-0 flex-1 space-y-5">
            {groups.map((group) => (
              <section key={group.letter} id={`letter-${group.letter}`}>
                <p className="eyebrow sticky top-0 z-10 bg-background/90 py-1 backdrop-blur-sm">{group.letter}</p>
                <ul className="mt-1 space-y-2">
                  {group.items.map((client) => (
                    <li key={client.key}>
                      <ClientRow client={client} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <ol className="sticky top-6 hidden h-fit w-6 shrink-0 flex-col items-center gap-0.5 text-[10px] text-muted-foreground lg:flex">
            {groups.map((group) => (
              <li key={group.letter}>
                <a href={`#letter-${group.letter}`} className="press block py-0.5 hover:text-ink">
                  {group.letter}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {clients.map((client) => (
            <li key={client.key}>
              <ClientRow client={client} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ClientRow({ client }: { client: Client }) {
  return (
    <Link
      href={`/owner/clients/${encodeURIComponent(client.key)}`}
      prefetch={false}
      className="press surface flex items-center gap-3 rounded-3xl px-4 py-3"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium uppercase text-card">
        {client.name.trim().charAt(0) || "?"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{client.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {client.nextVisit
            ? `Next ${prettyDay(client.nextVisit.date)} · ${formatClockTime(client.nextVisit.time)}`
            : client.lastVisit
              ? `Last ${prettyDay(client.lastVisit.date)}`
              : "No visits yet"}
          {client.note ? " · note" : ""}
        </span>
      </span>
      <span className="shrink-0 text-right text-xs text-muted-foreground">
        {client.visits.length} {client.visits.length === 1 ? "visit" : "visits"}
        {client.cancelled ? <span className="block">{client.cancelled} cancelled</span> : null}
      </span>
    </Link>
  );
}
