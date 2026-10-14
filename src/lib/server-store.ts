import { promises as fs } from "fs";
import path from "path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { chairBufferMinutes } from "./hours";
import { slotConflicts, type OccupiedSlot } from "./slots";

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
  updateNote?: string;
  extraBufferMinutes?: number;
  updatedAt?: string;
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
};

const empty: Store = { users: [], sessions: [], bookings: [], reviews: [] };

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

export async function createBooking(
  input: Omit<StudioBooking, "id" | "createdAt" | "status" | "updatedAt" | "extraBufferMinutes" | "updateNote">
) {
  return run(async () => {
    const store = await readStore();
    if (slotConflicts(input.date, input.time, input.hours, toOccupied(store.bookings))) {
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
        toOccupied(store.bookings, id),
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
