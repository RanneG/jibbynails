import { BookingWizard } from "./booking-wizard";
import { bookFromParams } from "@/lib/booking-url";
import { listBookings, toOccupied } from "@/lib/server-store";
import { currentUser } from "@/lib/session";

export const metadata = {
  title: "Book — Jibbynails",
};

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function detailsError(code: string) {
  if (code === "photo") return "Use a JPG, PNG, or WEBP under 4MB.";
  if (code === "brief") return "Say a little more about what you’re looking for.";
  if (code === "details") return "Add your name, mobile, and email, and tick the policy.";
  return "";
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const item = first(value);
    if (item) qs.set(key, item);
  }
  const [bookings, user] = await Promise.all([listBookings(), currentUser()]);
  const occupied = toOccupied(bookings);
  return (
    <BookingWizard
      book={bookFromParams(qs)}
      taken={first(raw.taken) === "1"}
      formError={detailsError(first(raw.err))}
      occupied={occupied}
      account={user ? { name: user.name, email: user.email, phone: user.phone } : null}
    />
  );
}
