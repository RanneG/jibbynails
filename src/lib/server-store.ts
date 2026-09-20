import { promises as fs } from "fs";
import path from "path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const FILE = path.join(process.cwd(), "data", "store.json");
const SECRET = process.env.SESSION_SECRET || "jibby-local-dev-secret";

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

type Store = {
  users: AccountUser[];
  sessions: Session[];
  bookings: StudioBooking[];
};

const empty: Store = { users: [], sessions: [], bookings: [] };

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
    };
  } catch {
    return { ...empty, users: [], sessions: [], bookings: [] };
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

export async function createBooking(input: Omit<StudioBooking, "id" | "createdAt">) {
  return run(async () => {
    const store = await readStore();
    const clash = store.bookings.some((item) => {
      if (item.date !== input.date) return false;
      const a = timeToMin(input.time);
      const b = timeToMin(item.time);
      return a < b + item.hours * 60 && b < a + input.hours * 60;
    });
    if (clash) return { ok: false as const, reason: "taken" };
    const booking: StudioBooking = {
      ...input,
      id: newId("visit"),
      createdAt: new Date().toISOString(),
    };
    store.bookings.push(booking);
    await writeStore(store);
    return { ok: true as const, booking };
  });
}

function timeToMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
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
