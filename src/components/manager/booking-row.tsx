import Link from "next/link";
import { Tags } from "@/components/manager/tag";
import { consultByHours, formatClockTime, prettyDay } from "@/lib/hours";
import { bookingTags, tierBar, visitEnd } from "@/lib/manager";
import type { StudioBooking } from "@/lib/server-store";
import { cn } from "@/lib/utils";

/**
 * One booking as a tappable row. `showDay` adds the date when the list spans
 * more than one day.
 */
export function BookingRow({
  booking,
  showDay,
  className,
}: {
  booking: StudioBooking;
  showDay?: boolean;
  className?: string;
}) {
  const tier = consultByHours(booking.hours);
  const cancelled = booking.status === "cancelled";
  return (
    <Link
      href={`/owner/booking/${booking.id}`}
      prefetch={false}
      className={cn(
        "press surface block overflow-hidden rounded-3xl",
        cancelled && "opacity-60",
        className
      )}
    >
      <span className="flex items-stretch">
        <span className={cn("w-1.5 shrink-0", cancelled ? "bg-ink/20" : tierBar(booking.hours))} />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-3 px-4 py-3.5">
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {showDay ? `${prettyDay(booking.date)} · ` : ""}
              {formatClockTime(booking.time)}–{formatClockTime(visitEnd(booking))}
            </span>
            <span className="mt-0.5 block truncate text-[15px]">{booking.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {tier ? `${tier.tier} · ${tier.name}` : `${booking.hours} h`}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1.5">
            <Tags tags={bookingTags(booking)} />
            {booking.nailPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.nailPhotoUrl} alt="" className="size-10 rounded-xl object-cover" />
            ) : null}
          </span>
        </span>
      </span>
    </Link>
  );
}
