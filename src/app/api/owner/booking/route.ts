import { extraBufferChoices } from "@/lib/hours";
import { isOwnerKey } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";
import { cancelBooking, updateBooking } from "@/lib/server-store";

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function back(key: string, err?: string) {
  const params = new URLSearchParams({ key });
  if (err) params.set("err", err);
  else params.set("saved", "1");
  return `/owner?${params.toString()}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const key = field(form, "key");
  if (!isOwnerKey(key)) return redirectTo(request, "/owner");

  const id = field(form, "id");
  const action = field(form, "action");
  const note = field(form, "note");

  if (action === "cancel") {
    if (field(form, "confirm") !== "1") return redirectTo(request, back(key, "confirm"));
    const result = await cancelBooking(id, note);
    return redirectTo(request, back(key, result.ok ? undefined : "missing"));
  }

  const extra = Number(field(form, "buffer"));
  if (!extraBufferChoices.includes(extra as (typeof extraBufferChoices)[number])) {
    return redirectTo(request, back(key, "buffer"));
  }
  const result = await updateBooking(id, { note, extraBufferMinutes: extra });
  return redirectTo(request, back(key, result.ok ? undefined : result.reason));
}
