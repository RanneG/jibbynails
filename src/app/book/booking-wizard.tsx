import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { HoursCard } from "@/components/hours-card";
import { bookHref, consultQuote, type BookState } from "@/lib/booking-url";
import { consultLengths, consultRate, formatClockTime, prettyDay } from "@/lib/hours";
import { formatDuration, formatMoney } from "@/lib/pricing";
import type { OccupiedSlot } from "@/lib/slots";
import { cn } from "@/lib/utils";

export function BookingWizard({
  book,
  occupied,
  account,
  taken,
  formError,
}: {
  book: BookState;
  occupied: OccupiedSlot[];
  account?: { name: string; email: string; phone: string } | null;
  taken?: boolean;
  formError?: string;
}) {
  const quote = book.hours ? consultQuote(book.hours) : consultQuote(0);
  const step = book.hours === 0 ? "duration" : book.step === "duration" && book.hours ? "when" : book.step;

  const back =
    step === "duration"
      ? "/"
      : step === "when"
        ? bookHref({ ...book, step: "duration" })
        : bookHref({ ...book, step: "when", time: undefined });

  return (
    <div className="flex min-h-0 flex-1 flex-col md:items-center md:px-6 md:py-8">
      <div className="flex min-h-0 flex-1 flex-col md:w-full md:max-w-[34rem] md:flex-none md:overflow-hidden md:rounded-[2rem] md:border md:border-ink/10 md:bg-card md:shadow-[0_16px_50px_rgba(80,55,35,0.08)]">
        <header className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-3">
          <Link
            href={back}
            className="press flex size-11 items-center justify-center rounded-full bg-background"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex min-w-0 flex-1 gap-1.5">
            {["duration", "when", "details"].map((item, index) => (
              <span
                key={item}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  ["duration", "when", "details"].indexOf(step) >= index ? "bg-ink" : "bg-ink/10"
                )}
              />
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {step === "duration" && (
            <>
              <p className="pill">£15 deposit / hour</p>
              <h1 className="font-heading mt-3 text-[2.6rem] leading-none">How long?</h1>
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                Chair time. Set prices are on the{" "}
                <Link href="/menu" className="underline">
                  menu
                </Link>
                .
              </p>
              <div className="mt-5 space-y-2">
                {consultLengths.map((item) => {
                  const selected = book.hours === item.hours;
                  return (
                    <Link
                      key={item.hours}
                      href={bookHref({ hours: item.hours, step: "when" })}
                      className={cn(
                        "press flex items-center justify-between rounded-full border px-5 py-4",
                        selected ? "border-ink bg-ink text-primary-foreground" : "border-ink/15 bg-card"
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span>{formatMoney(item.price)}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {step === "when" && (
            <>
              <h1 className="font-heading text-[2.6rem] leading-none">When?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {book.hours} hour{book.hours === 1 ? "" : "s"} · {formatMoney(book.hours * consultRate)}
              </p>
              <div className="mt-4">
                <HoursCard />
              </div>
              <div className="mt-5">
                <AvailabilityCalendar book={book} occupied={occupied} taken={taken} />
              </div>
            </>
          )}

          {step === "details" && (
            <form action="/api/book" method="post" className="space-y-4">
              <h1 className="font-heading text-[2.6rem] leading-none">Your details</h1>
              <p className="text-sm text-muted-foreground">
                {prettyDay(book.date || "")} · {book.time ? formatClockTime(book.time) : ""}
              </p>
              {formError ? (
                <p className="text-sm text-destructive">Check your details and the policy box.</p>
              ) : null}
              {account ? (
                <p className="rounded-full bg-sky px-4 py-2 text-sm">
                  Signed in as {account.name}. This visit goes on your account.
                </p>
              ) : null}
              <input type="hidden" name="h" value={String(book.hours)} />
              <input type="hidden" name="day" value={book.date || ""} />
              <input type="hidden" name="tm" value={book.time || ""} />
              <label className="block text-sm">
                Name
                <input
                  name="name"
                  required
                  minLength={2}
                  defaultValue={account?.name}
                  autoComplete="given-name"
                  className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                />
              </label>
              <label className="block text-sm">
                Mobile
                <input
                  name="phone"
                  type="tel"
                  required
                  minLength={10}
                  defaultValue={account?.phone}
                  autoComplete="tel"
                  inputMode="tel"
                  className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={account?.email}
                  autoComplete="email"
                  className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                />
              </label>
              <label className="block text-sm">
                What are you after?
                <textarea
                  name="inspo"
                  rows={3}
                  className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
                  placeholder="New set, infill, soak off, allergies"
                />
              </label>
              {!account ? (
                <label className="block text-sm">
                  Password <span className="text-muted-foreground">(optional — creates an account)</span>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
                  />
                </label>
              ) : null}
              <label className="flex items-start gap-3 text-sm leading-5">
                <input type="checkbox" name="policy" value="1" required className="mt-1 size-4" />
                <span>
                  I’ve read the{" "}
                  <Link href="/policy" className="underline">
                    booking policy
                  </Link>
                  . £15 deposit holds the slot. Balance in cash on the day.
                </span>
              </label>
              <div className="surface rounded-3xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{quote.lines[0]?.label}</span>
                  <span>{formatMoney(quote.total)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-ink/8 pt-3">
                  <span>
                    {prettyDay(book.date || "")} · {book.time ? formatClockTime(book.time) : ""}
                  </span>
                  <span>{formatMoney(quote.total)}</span>
                </div>
              </div>
              <button type="submit" className="btn-gold w-full">
                Confirm · {formatMoney(quote.total)} deposit
              </button>
            </form>
          )}
        </div>

        <div className="shrink-0 border-t border-ink/8 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {quote.minutes ? formatDuration(quote.minutes) : "Deposit"}
            </span>
            <span className="font-medium">{quote.total ? formatMoney(quote.total) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
