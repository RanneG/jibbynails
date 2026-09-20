export const dynamic = "force-dynamic";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { bookingsForUser } from "@/lib/server-store";
import { currentUser } from "@/lib/session";
import { formatClockTime, prettyDay } from "@/lib/hours";
import { consultQuote } from "@/lib/booking-url";
import { formatMoney } from "@/lib/pricing";
import { todayKey } from "@/lib/slots";

export const metadata = {
  title: "You — Jibbynails",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const mode = Array.isArray(raw.mode) ? raw.mode[0] : raw.mode;
  const err = Array.isArray(raw.err) ? raw.err[0] : raw.err;
  const saved = Array.isArray(raw.saved) ? raw.saved[0] : raw.saved;
  const user = await currentUser();

  if (!user) {
    const create = mode === "create";
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 px-5 pb-8 pt-10">
          <h1 className="font-heading text-center text-[3.1rem] leading-none">
            {create ? "Create account" : "You"}
          </h1>
          <p className="mt-2 text-center text-sm tracking-wide text-muted-foreground">
            Upcoming and past bookings, plus how I message you.
          </p>
          {err === "login" ? (
            <p className="mt-4 text-center text-sm text-destructive">Email or password doesn’t match.</p>
          ) : null}
          {err === "exists" ? (
            <p className="mt-4 text-center text-sm text-destructive">That email already has an account.</p>
          ) : null}
          {err === "details" ? (
            <p className="mt-4 text-center text-sm text-destructive">Fill every field. Password 6+ characters.</p>
          ) : null}

          <form action={create ? "/api/auth/register" : "/api/auth/login"} method="post" className="mt-6 space-y-3">
            {create ? (
              <>
                <input name="name" required minLength={2} placeholder="Name" className="h-12 w-full rounded-full border border-input bg-card px-4" />
                <input name="phone" required minLength={10} placeholder="Mobile" className="h-12 w-full rounded-full border border-input bg-card px-4" />
              </>
            ) : null}
            <input name="email" type="email" required placeholder="Email" className="h-12 w-full rounded-full border border-input bg-card px-4" />
            <input name="password" type="password" required minLength={6} placeholder="Password" className="h-12 w-full rounded-full border border-input bg-card px-4" />
            <button type="submit" className="btn-gold w-full">
              {create ? "Create account" : "Sign in"}
            </button>
          </form>
          <Link
            href={create ? "/account" : "/account?mode=create"}
            className="mt-4 block text-center text-sm underline underline-offset-4"
          >
            {create ? "I already have an account" : "Create an account"}
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const visits = await bookingsForUser(user.id, user.email);
  const today = todayKey();
  const upcoming = visits.filter((item) => `${item.date}${item.time}` >= `${today}00:00`);
  const past = visits.filter((item) => `${item.date}${item.time}` < `${today}00:00`).reverse();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-8">
        <h1 className="font-heading text-[3rem] leading-none">{user.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
        {user.email}
        </p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button type="submit" className="press rounded-full border border-ink/15 px-3 py-1.5 text-sm">Sign out</button>
        </form>
        <section className="mt-8">
          <h2 className="font-heading text-[2.2rem] leading-none">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming visits. <Link href="/book" className="underline">Book</Link></p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((item) => {
                const quote = consultQuote(item.hours);
                return (
                  <li key={item.id}>
                    <Link className="press surface flex items-center justify-between gap-3 rounded-3xl px-4 py-3.5" href={`/booked?id=${item.id}`}>
                      <span>
                        <span className="block text-sm">{prettyDay(item.date)} · {formatClockTime(item.time)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">Consultation · {item.hours} hours</span>
                      </span>
                      <span className="text-sm">{formatMoney(quote.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="mt-8">
          <h2 className="font-heading text-[2.2rem] leading-none">Past</h2>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No past visits yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {past.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground">
                  {prettyDay(item.date)} · {formatClockTime(item.time)}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-8">
          <h2 className="font-heading text-[2.2rem] leading-none">My details</h2>
          {saved ? <p className="mt-3 rounded-full bg-sky px-4 py-2 text-sm">Saved. We don’t send texts or emails from this demo.</p> : null}
          <form className="surface mt-4 space-y-3 rounded-3xl p-5" action="/api/account/comms" method="post">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>SMS marketing</span>
              <input type="checkbox" className="size-4" name="sms" defaultChecked={user.comms.sms} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Email marketing</span>
              <input type="checkbox" className="size-4" name="email" defaultChecked={user.comms.email} />
            </label>
            <button type="submit" className="btn-gold w-full">Save prefs</button>
          </form>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
