import { promises as fs } from "fs";
import path from "path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { chairBufferMinutes } from "./hours";
import { holdMinutes, holdsAsOccupied, slotConflicts, type DayOverride, type OccupiedSlot, type TimeHold } from "./slots";

export type { DayOverride, TimeHold } from "./slots";

export type StudioEmployee = {
  id: string;
  name: string;
  createdAt: string;
};

export type Shift = {
  date: string;
  employeeId: string;
};

export const DEFAULT_EMPLOYEE_ID = "emp_jibby";

export const DEFAULT_EMPLOYEE: StudioEmployee = {
  id: DEFAULT_EMPLOYEE_ID,
  name: "Jibby",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const FILE = path.join(process.cwd(), "data", "store.json");
const SECRET = process.env.SESSION_SECRET || "jibby-local-dev-secret";

export type BookingStatus = "confirmed" | "updated" | "cancelled";

export type StudioBooking = {
  id: string;
  createdAt: string;
  userId?: string;
  hours: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  inspo: string;
  nailPhotoUrl?: string;
  status?: BookingStatus;
  /** Message the client sees on their booking. */
  updateNote?: string;
  extraBufferMinutes?: number;
  updatedAt?: string;
  /** When Jibby first opened this booking in the manager. Unset means it is new to her. */
  ownerSeenAt?: string;
  depositPaid?: boolean;
  /** What she actually charged on the day, in pounds. */
  chargedOnDay?: number;
  /** Only Jibby sees this. */
  ownerNote?: string;
};

export type ClientNote = {
  /** Lower-cased email. */
  key: string;
  note: string;
  updatedAt: string;
};

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  comms: { sms: boolean; email: boolean };
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type StoredReview = {
  id: string;
  createdAt: string;
  name: string;
  rating: number;
  text: string;
  photoUrl?: string;
  visitId?: string;
  visibility: "public" | "private";
};

type Store = {
  users: AccountUser[];
  sessions: Session[];
  bookings: StudioBooking[];
  reviews: StoredReview[];
  overrides: DayOverride[];
  clientNotes: ClientNote[];
  holds: TimeHold[];
  employees: StudioEmployee[];
  shifts: Shift[];
};

const empty: Store = {
  users: [],
  sessions: [],
  bookings: [],
  reviews: [],
  overrides: [],
  clientNotes: [],
  holds: [],
  employees: [],
  shifts: [],
};

let queue: Promise<unknown> = Promise.resolve();

function run<T>(fn: () => Promise<T>) {
  const next = queue.then(fn, fn);
  queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      users: parsed.users ?? [],
      sessions: parsed.sessions ?? [],
      bookings: parsed.bookings ?? [],
      reviews: parsed.reviews ?? [],
      overrides: parsed.overrides ?? [],
      clientNotes: parsed.clientNotes ?? [],
      holds: parsed.holds ?? [],
      employees: parsed.employees ?? [],
      shifts: parsed.shifts ?? [],
    };
  } catch {
    return { ...empty };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32).toString("hex");
}

export function verifyPassword(password: string, user: AccountUser) {
  const next = Buffer.from(hashPassword(password, user.salt), "hex");
  const prev = Buffer.from(user.passwordHash, "hex");
  return next.length === prev.length && timingSafeEqual(next, prev);
}

export function signToken(value: string) {
  return createHash("sha256").update(`${SECRET}:${value}`).digest("hex");
}

export async function listBookings() {
  return run(async () => (await readStore()).bookings);
}

export async function findBooking(id: string) {
  const bookings = await listBookings();
  return bookings.find((item) => item.id === id);
}

/** Full chair block in hours: the visit plus the gap she uses to message the client. */
export function blockedHours(booking: Pick<StudioBooking, "hours" | "extraBufferMinutes" | "status">) {
  if (booking.status === "cancelled") return 0;
  return booking.hours + (chairBufferMinutes + (booking.extraBufferMinutes ?? 0)) / 60;
}

export function toOccupied(bookings: StudioBooking[], exceptId?: string): OccupiedSlot[] {
  return bookings
    .filter((item) => item.id !== exceptId && item.status !== "cancelled")
    .map((item) => ({ date: item.date, time: item.time, hours: blockedHours(item) }));
}

/** Chair time already taken: visits, their buffers, and any booked-out breaks. */
export function chairOccupied(bookings: StudioBooking[], holds: TimeHold[] = [], exceptId?: string): OccupiedSlot[] {
  return [...toOccupied(bookings, exceptId), ...holdsAsOccupied(holds)];
}

function employeesOf(store: Store): StudioEmployee[] {
  return store.employees.length > 0 ? store.employees : [{ ...DEFAULT_EMPLOYEE }];
}

function ensureTeam(store: Store) {
  if (store.employees.length === 0) store.employees = [{ ...DEFAULT_EMPLOYEE }];
}

export async function createBooking(
  input: Omit<StudioBooking, "id" | "createdAt" | "status" | "updatedAt" | "extraBufferMinutes" | "updateNote">
) {
  return run(async () => {
    const store = await readStore();
    if (slotConflicts(input.date, input.time, input.hours, chairOccupied(store.bookings, store.holds))) {
      return { ok: false as const, reason: "taken" };
    }
    const booking: StudioBooking = {
      ...input,
      status: "confirmed",
      extraBufferMinutes: 0,
      id: newId("visit"),
      createdAt: new Date().toISOString(),
    };
    store.bookings.push(booking);
    await writeStore(store);
    return { ok: true as const, booking };
  });
}

export async function updateBooking(
  id: string,
  input: { note: string; extraBufferMinutes: number }
) {
  return run(async () => {
    const store = await readStore();
    const current = store.bookings.find((item) => item.id === id);
    if (!current || current.status === "cancelled") return { ok: false as const, reason: "missing" };
    const extra = input.extraBufferMinutes;
    if (
      slotConflicts(
        current.date,
        current.time,
        current.hours,
        chairOccupied(store.bookings, store.holds, id),
        chairBufferMinutes + extra
      )
    ) {
      return { ok: false as const, reason: "overlap" };
    }
    const note = input.note.trim();
    store.bookings = store.bookings.map((item) =>
      item.id === id
        ? {
            ...item,
            updateNote: note || undefined,
            extraBufferMinutes: extra,
            status: note || extra > 0 ? "updated" : "confirmed",
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    await writeStore(store);
    return { ok: true as const };
  });
}

export async function cancelBooking(id: string, note: string) {
  return run(async () => {
    const store = await readStore();
    const current = store.bookings.find((item) => item.id === id);
    if (!current || current.status === "cancelled") return { ok: false as const, reason: "missing" };
    const message = note.trim() || "Jibby cancelled this booking. Message her if you need another time.";
    store.bookings = store.bookings.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "cancelled" as const,
            updateNote: message,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    await writeStore(store);
    return { ok: true as const };
  });
}

/* ---------- Owner-only: what Jibby tracks that the client never sees ---------- */

export async function markBookingSeen(id: string) {
  return run(async () => {
    const store = await readStore();
    const current = store.bookings.find((item) => item.id === id);
    if (!current || current.ownerSeenAt) return;
    current.ownerSeenAt = new Date().toISOString();
    await writeStore(store);
  });
}

export async function markAllBookingsSeen() {
  return run(async () => {
    const store = await readStore();
    const now = new Date().toISOString();
    store.bookings = store.bookings.map((item) => (item.ownerSeenAt ? item : { ...item, ownerSeenAt: now }));
    await writeStore(store);
  });
}

export async function setBookingPrivate(
  id: string,
  input: { depositPaid: boolean; chargedOnDay?: number; ownerNote: string }
) {
  return run(async () => {
    const store = await readStore();
    const current = store.bookings.find((item) => item.id === id);
    if (!current) return { ok: false as const, reason: "missing" };
    const note = input.ownerNote.trim();
    store.bookings = store.bookings.map((item) =>
      item.id === id
        ? {
            ...item,
            depositPaid: input.depositPaid,
            chargedOnDay: input.chargedOnDay,
            ownerNote: note || undefined,
          }
        : item
    );
    await writeStore(store);
    return { ok: true as const };
  });
}

export async function listOverrides() {
  return run(async () => (await readStore()).overrides);
}

export async function setOverride(override: DayOverride) {
  return run(async () => {
    const store = await readStore();
    store.overrides = [...store.overrides.filter((item) => item.date !== override.date), override].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    await writeStore(store);
  });
}

export async function removeOverride(date: string) {
  return run(async () => {
    const store = await readStore();
    store.overrides = store.overrides.filter((item) => item.date !== date);
    await writeStore(store);
  });
}

export async function listHolds() {
  return run(async () => (await readStore()).holds);
}

export async function addHold(input: { date: string; start: string; end: string; note?: string }) {
  return run(async () => {
    const store = await readStore();
    const minutes = holdMinutes(input);
    if (minutes < 30) return { ok: false as const, reason: "hold" };
    if (slotConflicts(input.date, input.start, minutes / 60, chairOccupied(store.bookings, store.holds), 0)) {
      return { ok: false as const, reason: "overlap" };
    }
    const hold: TimeHold = {
      id: newId("hold"),
      date: input.date,
      start: input.start,
      end: input.end,
      note: input.note,
    };
    store.holds = [...store.holds, hold].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
    await writeStore(store);
    return { ok: true as const, hold };
  });
}

export async function removeHold(id: string) {
  return run(async () => {
    const store = await readStore();
    const before = store.holds.length;
    store.holds = store.holds.filter((item) => item.id !== id);
    if (store.holds.length === before) return { ok: false as const, reason: "missing" };
    await writeStore(store);
    return { ok: true as const };
  });
}

export async function listEmployees() {
  return run(async () => employeesOf(await readStore()));
}

export async function addEmployee(name: string) {
  return run(async () => {
    const store = await readStore();
    const trimmed = name.replace(/\s+/g, " ").trim();
    if (trimmed.length < 2 || trimmed.length > 40) return { ok: false as const, reason: "name" };
    ensureTeam(store);
    if (store.employees.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false as const, reason: "exists" };
    }
    const employee: StudioEmployee = { id: newId("emp"), name: trimmed, createdAt: new Date().toISOString() };
    store.employees.push(employee);
    await writeStore(store);
    return { ok: true as const, employee };
  });
}

export async function removeEmployee(id: string) {
  return run(async () => {
    const store = await readStore();
    ensureTeam(store);
    if (id === DEFAULT_EMPLOYEE_ID) return { ok: false as const, reason: "default" };
    if (!store.employees.some((item) => item.id === id)) return { ok: false as const, reason: "missing" };
    store.employees = store.employees.filter((item) => item.id !== id);
    store.shifts = store.shifts.map((item) => (item.employeeId === id ? { ...item, employeeId: DEFAULT_EMPLOYEE_ID } : item));
    await writeStore(store);
    return { ok: true as const };
  });
}

export async function listShifts() {
  return run(async () => (await readStore()).shifts);
}

export async function setShift(shift: Shift) {
  return run(async () => {
    const store = await readStore();
    ensureTeam(store);
    if (!store.employees.some((item) => item.id === shift.employeeId)) {
      return { ok: false as const, reason: "missing" };
    }
    store.shifts = [...store.shifts.filter((item) => item.date !== shift.date), shift].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    await writeStore(store);
    return { ok: true as const };
  });
}

export async function removeShift(date: string) {
  return run(async () => {
    const store = await readStore();
    store.shifts = store.shifts.filter((item) => item.date !== date);
    await writeStore(store);
  });
}

export async function listClientNotes() {
  return run(async () => (await readStore()).clientNotes);
}

export async function setClientNote(key: string, note: string) {
  return run(async () => {
    const store = await readStore();
    const trimmed = note.trim();
    const rest = store.clientNotes.filter((item) => item.key !== key);
    store.clientNotes = trimmed ? [...rest, { key, note: trimmed, updatedAt: new Date().toISOString() }] : rest;
    await writeStore(store);
  });
}

export async function findUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  return run(async () => {
    const store = await readStore();
    if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      return { ok: false as const, reason: "exists" };
    }
    const salt = randomBytes(12).toString("hex");
    const user: AccountUser = {
      id: newId("user"),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash: hashPassword(input.password, salt),
      salt,
      comms: { sms: false, email: false },
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await writeStore(store);
    return { ok: true as const, user };
  });
}

export async function attachBookingsToUser(email: string, userId: string) {
  return run(async () => {
    const store = await readStore();
    store.bookings = store.bookings.map((item) =>
      !item.userId && item.email.toLowerCase() === email.toLowerCase()
        ? { ...item, userId }
        : item
    );
    await writeStore(store);
  });
}

export async function createSession(userId: string) {
  return run(async () => {
    const store = await readStore();
    const raw = randomBytes(18).toString("hex");
    const token = `${raw}.${signToken(raw)}`;
    store.sessions = store.sessions.filter((item) => item.expiresAt > Date.now());
    store.sessions.push({
      token,
      userId,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    await writeStore(store);
    return token;
  });
}

export async function userFromToken(token?: string | null) {
  if (!token) return null;
  const store = await readStore();
  const session = store.sessions.find((item) => item.token === token && item.expiresAt > Date.now());
  if (!session) return null;
  return store.users.find((user) => user.id === session.userId) ?? null;
}

export async function clearSession(token?: string | null) {
  if (!token) return;
  return run(async () => {
    const store = await readStore();
    store.sessions = store.sessions.filter((item) => item.token !== token);
    await writeStore(store);
  });
}

export async function updateComms(userId: string, comms: { sms: boolean; email: boolean }) {
  return run(async () => {
    const store = await readStore();
    store.users = store.users.map((user) => (user.id === userId ? { ...user, comms } : user));
    await writeStore(store);
  });
}

export async function bookingsForUser(userId: string, email: string) {
  const bookings = await listBookings();
  return bookings
    .filter((item) => item.userId === userId || item.email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export async function listPublicReviews() {
  const store = await readStore();
  return store.reviews
    .filter((item) => item.visibility === "public")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPrivateFeedback() {
  const store = await readStore();
  return store.reviews
    .filter((item) => item.visibility === "private")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReview(input: {
  name: string;
  rating: number;
  text: string;
  photoUrl?: string;
  visitId?: string;
}) {
  return run(async () => {
    const store = await readStore();
    const review: StoredReview = {
      id: newId("rev"),
      createdAt: new Date().toISOString(),
      name: input.name,
      rating: input.rating,
      text: input.text,
      photoUrl: input.photoUrl,
      visitId: input.visitId,
      visibility: input.rating >= 5 ? "public" : "private",
    };
    store.reviews.push(review);
    await writeStore(store);
    return review;
  });
}
