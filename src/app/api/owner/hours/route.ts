import { isValidDate } from "@/lib/manager";
import { isOwner } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";
import {
  addEmployee,
  addHold,
  listOverrides,
  removeEmployee,
  removeHold,
  removeOverride,
  removeShift,
  setOverride,
  setShift,
} from "@/lib/server-store";
import { clockStamps, dayHours, isClockStamp, timeToMinutes, todayKey } from "@/lib/slots";

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function hoursUrl(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/owner/hours?${query.toString()}`;
}

export async function POST(request: Request) {
  if (!(await isOwner())) return redirectTo(request, "/owner/login");
  const form = await request.formData();
  const action = field(form, "action");

  if (action === "add-employee") {
    const date = field(form, "date");
    const result = await addEmployee(field(form, "name"));
    const params: Record<string, string> = result.ok ? { saved: "team" } : { err: result.reason };
    if (isValidDate(date)) params.date = date;
    return redirectTo(request, hoursUrl(params));
  }

  if (action === "remove-employee") {
    const date = field(form, "date");
    const result = await removeEmployee(field(form, "id"));
    const params: Record<string, string> = result.ok ? { saved: "gone" } : { err: result.reason };
    if (isValidDate(date)) params.date = date;
    return redirectTo(request, hoursUrl(params));
  }

  if (action === "unhold") {
    const result = await removeHold(field(form, "id"));
    const date = field(form, "date");
    const params: Record<string, string> = result.ok ? { saved: "unhold" } : { err: "missing" };
    if (isValidDate(date)) params.date = date;
    return redirectTo(request, hoursUrl(params));
  }

  const date = field(form, "date");
  if (!isValidDate(date)) return redirectTo(request, hoursUrl({ err: "date" }));

  if (action === "remove") {
    await Promise.all([removeOverride(date), removeShift(date)]);
    return redirectTo(request, hoursUrl({ saved: "usual", date }));
  }

  if (date < todayKey()) return redirectTo(request, hoursUrl({ err: "past", date }));

  if (action === "hold") {
    const start = field(form, "start");
    const end = field(form, "end");
    const note = field(form, "note").slice(0, 40);
    if (!isClockStamp(start) || !isClockStamp(end) || timeToMinutes(end) - timeToMinutes(start) < 30) {
      return redirectTo(request, hoursUrl({ err: "hold", date }));
    }
    const overrides = await listOverrides();
    const day = dayHours(date, overrides);
    if (day.closed) return redirectTo(request, hoursUrl({ err: "closed", date }));
    const stamps = clockStamps(day.openHour, day.closeHour);
    if (timeToMinutes(start) < day.openHour * 60 || timeToMinutes(end) > day.closeHour * 60) {
      return redirectTo(request, hoursUrl({ err: "window", date }));
    }
    if (!stamps.includes(start) || !stamps.includes(end)) {
      return redirectTo(request, hoursUrl({ err: "hold", date }));
    }
    const result = await addHold({ date, start, end, note: note || undefined });
    if (!result.ok) return redirectTo(request, hoursUrl({ err: result.reason, date }));
    return redirectTo(request, hoursUrl({ saved: "hold", date }));
  }

  const note = field(form, "note").slice(0, 80);
  const employeeId = field(form, "employee");

  if (employeeId === "off" || !employeeId) {
    await Promise.all([setOverride({ date, closed: true, note: note || undefined }), removeShift(date)]);
    return redirectTo(request, hoursUrl({ saved: "closed", date }));
  }

  const openHour = Number(field(form, "open"));
  const closeHour = Number(field(form, "close"));
  const whole = (n: number) => Number.isInteger(n) && n >= 6 && n <= 22;
  if (!whole(openHour) || !whole(closeHour) || closeHour - openHour < 1) {
    return redirectTo(request, hoursUrl({ err: "hours", date }));
  }

  const shift = await setShift({ date, employeeId });
  if (!shift.ok) return redirectTo(request, hoursUrl({ err: "team", date }));
  await setOverride({ date, closed: false, openHour, closeHour, note: note || undefined });
  return redirectTo(request, hoursUrl({ saved: "hours", date }));
}
