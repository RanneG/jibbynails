import { durationLabel } from "@/lib/hours";

export function BookingNotice({
  note,
  extraMinutes,
  hours,
  cancelled,
}: {
  note?: string;
  extraMinutes?: number;
  hours?: number;
  cancelled?: boolean;
}) {
  if (!cancelled && !note && !extraMinutes) return null;
  const length = typeof hours === "number" ? durationLabel(hours) : "appointment";
  return (
    <div className="rounded-2xl bg-sky px-4 py-3 text-sm leading-6">
      {cancelled ? <p className="font-medium">Cancelled</p> : null}
      {extraMinutes ? (
        <p className={cancelled ? "mt-1" : undefined}>
          Jibby added {extraMinutes} minutes after your {length}, in case the set needs it. Arrive at the booked time.
        </p>
      ) : null}
      {note ? <p className={cancelled || extraMinutes ? "mt-1" : undefined}>{note}</p> : null}
    </div>
  );
}
