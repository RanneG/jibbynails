import { cookies } from "next/headers";
import { redirectTo } from "@/lib/redirect";
import { clearSession } from "@/lib/server-store";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const jar = await cookies();
  await clearSession(jar.get(SESSION_COOKIE)?.value);
  await clearSessionCookie();
  return redirectTo(request, "/account");
}
