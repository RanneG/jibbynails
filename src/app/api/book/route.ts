import { promises as fs } from "fs";
import path from "path";
import { consultByHours } from "@/lib/hours";
import { redirectTo } from "@/lib/redirect";
import { currentUser, sessionCookie } from "@/lib/session";
import {
  attachBookingsToUser,
  createBooking,
  createSession,
  createUser,
  findUserByEmail,
  listBookings,
  newId,
  toOccupied,
  verifyPassword,
} from "@/lib/server-store";
import { daySlots, pastBookingCutoff, slotConflicts } from "@/lib/slots";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function detailsBack(hours: number, date: string, time: string, err: string) {
  const params = new URLSearchParams({
    s: "details",
    h: String(hours),
    day: date,
    tm: time,
    err,
  });
  return `/book?${params.toString()}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const tier = consultByHours(Number(field(form, "h")));
  const date = field(form, "day");
  const time = field(form, "tm");
  const name = field(form, "name");
  const phone = field(form, "phone");
  const email = field(form, "email");
  const inspo = field(form, "inspo");
  const password = field(form, "password");
  const policy = field(form, "policy");

  if (!tier || !date || !time) {
    return redirectTo(request, "/book");
  }
  const hours = tier.hours;
  if (inspo.length < 8) {
    return redirectTo(request, detailsBack(hours, date, time, "brief"));
  }
  if (name.length < 2 || phone.length < 10 || !email.includes("@") || !policy) {
    return redirectTo(request, detailsBack(hours, date, time, "details"));
  }

  const photo = form.get("photo");
  let nailPhotoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES || !TYPES[photo.type]) {
      return redirectTo(request, detailsBack(hours, date, time, "photo"));
    }
  }

  if (pastBookingCutoff(date)) {
    const params = new URLSearchParams({ s: "when", h: String(hours), day: date });
    return redirectTo(request, `/book?${params.toString()}`);
  }

  const occupied = toOccupied(await listBookings());
  const open = daySlots(date, hours * 60, occupied);
  if (slotConflicts(date, time, hours, occupied) || !open.times.includes(time)) {
    const params = new URLSearchParams({ s: "when", h: String(hours), day: date, taken: "1" });
    return redirectTo(request, `/book?${params.toString()}`);
  }

  if (photo instanceof File && photo.size > 0 && TYPES[photo.type]) {
    const fileName = `${newId("nails")}${TYPES[photo.type]}`;
    const dest = path.join(process.cwd(), "public", "nails", fileName);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await photo.arrayBuffer()));
    nailPhotoUrl = `/nails/${fileName}`;
  }

  const user = await currentUser();
  let userId = user?.id;

  if (!userId && password.length >= 6) {
    const created = await createUser({ name, email, phone, password });
    if (created.ok) {
      userId = created.user.id;
      await attachBookingsToUser(email, userId);
      await sessionCookie(await createSession(userId));
    } else {
      const existing = await findUserByEmail(email);
      if (existing && verifyPassword(password, existing)) {
        userId = existing.id;
        await attachBookingsToUser(email, userId);
        await sessionCookie(await createSession(userId));
      }
    }
  }

  const result = await createBooking({
    hours,
    date,
    time,
    name,
    phone,
    email,
    inspo,
    nailPhotoUrl,
    userId,
  });

  if (!result.ok) {
    const params = new URLSearchParams({ s: "when", h: String(hours), day: date, taken: "1" });
    return redirectTo(request, `/book?${params.toString()}`);
  }

  return redirectTo(request, `/booked?id=${result.booking.id}`);
}
