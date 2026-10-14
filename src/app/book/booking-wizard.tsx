import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { HoursCard } from "@/components/hours-card";
import { TierCover } from "@/components/tier-cover";
import { bookHref, consultQuote, type BookState } from "@/lib/booking-url";
import {
  chairBufferMinutes,
  consultByHours,
  consultLengths,
  formatClockTime,
  prettyDay,
  tierTitle,
  typicalHoursLabel,
} from "@/lib/hours";
import { formatDuration, formatMoney } from "@/lib/pricing";
import type { OccupiedSlot } from "@/lib/slots";
import { cn } from "@/lib/utils";

const steps = ["tier", "when", "details"] as const;

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
  const tier = book.hours != null ? consultByHours(book.hours) : undefined;
  const step =
    book.step === "details" && tier && book.date && book.time
      ? "details"
      : book.step === "when" && tier
        ? "when"
        : "tier";
  const quote = tier ? consultQuote(tier.hours) : null;
  const back =
    step === "tier"
      ? "/"
      : step === "when"
        ? bookHref({ step: "tier", hours: tier?.hours })
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
            {steps.map((item, index) => (
              <span
                key={item}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  steps.indexOf(step) >= index ? "bg-ink" : "bg-ink/10"
                )}
              />
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {step === "tier" && (
            <>
              <p className="pill">£15 an hour</p>
              <h1 className="font-heading mt-3 text-[2.6rem] leading-none">Which slot?</h1>
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                Pick the tier that fits the work. Deposit is £15 an hour. {typicalHoursLabel()}.{" "}
                <Link href="/sets" className="underline underline-offset-4">
                  Not sure? See the sets.
                </Link>
              </p>
              <ul className="mt-4 space-y-2">
                {consultLengths.map((item) => (
                  <li key={item.tier}>
                    <Link
                      href={bookHref({ hours: item.hours, step: "when" })}
                      className={cn(
                        "press surface flex gap-3 rounded-3xl p-3",
                        tier?.hours === item.hours && "ring-1 ring-ink"
                      )}
                    >
                      <TierCover hours={item.hours} className="size-[4.75rem] shrink-0 rounded-2xl" />
                      <span className="min-w-0 flex-1 py-0.5">
                        <span className="block text-sm font-medium">{item.name}</span>
                        <span className="mt-0.5 block text-xs tracking-wide text-muted-foreground">
                          {item.tier} · {item.label}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{item.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === "when" && tier && (
            <>
              <p className="pill">
                {tier.tier} · {tier.label}
              </p>
              <h1 className="font-heading mt-3 text-[2.6rem] leading-none">When?</h1>
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                {tier.name}. {formatMoney(tier.price)} deposit. {chairBufferMinutes} minutes after is kept free so
                she can message you.
              </p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{tier.detail}</p>
              <div className="mt-4">
                <HoursCard />
              </div>
              <div className="mt-5">
                <AvailabilityCalendar book={{ ...book, hours: tier.hours }} occupied={occupied} taken={taken} />
              </div>
            </>
          )}

          {step === "details" && tier && quote && (
            <form action="/api/book" method="post" encType="multipart/form-data" className="space-y-4">
              <h1 className="font-heading text-[2.6rem] leading-none">Your details</h1>
              <p className="text-sm text-muted-foreground">
                {prettyDay(book.date || "")} · {book.time ? formatClockTime(book.time) : ""} · {tierTitle(tier.hours)}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Mobile, email, and what you want are required. A photo of your nails now helps her plan the time.
              </p>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              {account ? (
                <p className="rounded-full bg-sky px-4 py-2 text-sm">
                  Signed in as {account.name}. This visit goes on your account.
                </p>
              ) : null}
              <input type="hidden" name="h" value={String(tier.hours)} />
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
                What are you looking for?
                <textarea
                  name="inspo"
                  required
                  minLength={8}
                  rows={3}
                  className="mt-1.5 w-full rounded-3xl border border-input bg-card px-4 py-2.5 outline-none focus:border-ink"
                  placeholder="Length, shape, art, soak off, allergies"
                />
              </label>
              <label className="block text-sm">
                Photo of your nails now
                <span className="text-muted-foreground"> (optional)</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:text-primary-foreground"
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
                  . {formatMoney(quote.total)} deposit holds this {tier.label} slot. Balance in cash on the day.
                </span>
              </label>
              <div className="surface rounded-3xl p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="min-w-0 text-muted-foreground">{quote.lines[0]?.label}</span>
                  <span className="shrink-0">{formatMoney(quote.total)}</span>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-ink/8 pt-3">
                  <span>
                    {prettyDay(book.date || "")} · {book.time ? formatClockTime(book.time) : ""}
                  </span>
                  <span className="shrink-0">{formatMoney(quote.total)}</span>
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
            {quote && step !== "tier" ? (
              <>
                <span className="text-muted-foreground">{formatDuration(quote.minutes)}</span>
                <span className="font-medium">{formatMoney(quote.total)}</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">£15 an hour</span>
                <span className="font-medium">£15–£45</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
