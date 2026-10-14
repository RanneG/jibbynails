import { extraBufferChoices } from "@/lib/hours";
import { isOwner } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";
import {
  cancelBooking,
  markAllBookingsSeen,
  markBookingSeen,
  setBookingPrivate,
  updateBooking,
} from "@/lib/server-store";

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

/** Only ever send her back to a manager page. */
function safeBack(value: string, fallback: string) {
  return value.startsWith("/owner") ? value : fallback;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://x");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function POST(request: Request) {
  if (!(await isOwner())) return redirectTo(request, "/owner/login");
  const form = await request.formData();
  const id = field(form, "id");
  const action = field(form, "action");
  const back = safeBack(field(form, "back"), id ? `/owner/booking/${id}` : "/owner");

  if (action === "seen") {
    await markBookingSeen(id);
    return redirectTo(request, back);
  }

  if (action === "seen-all") {
    await markAllBookingsSeen();
    return redirectTo(request, back);
  }

  if (action === "cancel") {
    if (field(form, "confirm") !== "1") return redirectTo(request, withQuery(back, { err: "confirm" }));
    const result = await cancelBooking(id, field(form, "note"));
    return redirectTo(request, withQuery(back, result.ok ? { saved: "cancelled" } : { err: "missing" }));
  }

  if (action === "private") {
    const chargedRaw = field(form, "charged").replace(/[£,\s]/g, "");
    const charged = chargedRaw === "" ? undefined : Number(chargedRaw);
    if (charged != null && (!Number.isFinite(charged) || charged < 0 || charged > 2000)) {
      return redirectTo(request, withQuery(back, { err: "charged" }));
    }
    const result = await setBookingPrivate(id, {
      depositPaid: field(form, "deposit") === "1",
      chargedOnDay: charged,
      ownerNote: field(form, "note"),
    });
    return redirectTo(request, withQuery(back, result.ok ? { saved: "private" } : { err: "missing" }));
  }

  // Default: the message and extra buffer the client sees.
  const extra = Number(field(form, "buffer"));
  if (!extraBufferChoices.includes(extra as (typeof extraBufferChoices)[number])) {
    return redirectTo(request, withQuery(back, { err: "buffer" }));
  }
  const result = await updateBooking(id, { note: field(form, "note"), extraBufferMinutes: extra });
  return redirectTo(request, withQuery(back, result.ok ? { saved: "client" } : { err: result.reason }));
}
