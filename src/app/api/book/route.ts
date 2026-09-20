import { consultLengths } from "@/lib/hours";
import { redirectTo } from "@/lib/redirect";
import { currentUser, sessionCookie } from "@/lib/session";
import {
  attachBookingsToUser,
  createBooking,
  createSession,
  createUser,
  findUserByEmail,
  listBookings,
  verifyPassword,
} from "@/lib/server-store";
import { daySlots, slotConflicts } from "@/lib/slots";

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request) {
  const form = await request.formData();
  const hours = Number(field(form, "h"));
  const date = field(form, "day");
  const time = field(form, "tm");
  const name = field(form, "name");
  const phone = field(form, "phone");
  const email = field(form, "email");
  const inspo = field(form, "inspo");
  const password = field(form, "password");
  const policy = field(form, "policy");

  const validHours = consultLengths.some((item) => item.hours === hours);
  if (!validHours || !date || !time || name.length < 2 || phone.length < 10 || !email.includes("@") || !policy) {
    return redirectTo(request, "/book?s=details&err=details");
  }

  const occupied = await listBookings();
  const open = daySlots(date, hours * 60, occupied);
  if (slotConflicts(date, time, hours, occupied) || !open.times.includes(time)) {
    return redirectTo(request, `/book?s=when&h=${hours}&day=${date}&taken=1`);
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
    userId,
  });

  if (!result.ok) {
    return redirectTo(request, `/book?s=when&h=${hours}&day=${date}&taken=1`);
  }

  return redirectTo(request, `/booked?id=${result.booking.id}`);
}
