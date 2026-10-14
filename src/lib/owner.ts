import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signToken } from "./server-store";

export const OWNER_COOKIE = "jibby_owner";

/**
 * Keys that open the manager. Set `OWNER_KEYS` (comma-separated) in production;
 * the fallback is for local development only.
 */
function ownerKeys() {
  const fromEnv = (process.env.OWNER_KEYS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set(fromEnv.length > 0 ? fromEnv : ["jibby-owner", "jibby"]);
}

export function isOwnerKey(value?: string | null) {
  return Boolean(value && ownerKeys().has(value));
}

function ownerToken() {
  return signToken("owner:v1");
}

export async function isOwner() {
  const jar = await cookies();
  return jar.get(OWNER_COOKIE)?.value === ownerToken();
}

/** Server components: send her to the key screen if she isn't signed in. */
export async function requireOwner() {
  if (!(await isOwner())) redirect("/owner/login");
}

export async function setOwnerCookie() {
  const jar = await cookies();
  jar.set(OWNER_COOKIE, ownerToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearOwnerCookie() {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE);
}
