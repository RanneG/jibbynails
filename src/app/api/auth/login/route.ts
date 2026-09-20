import { redirectTo } from "@/lib/redirect";
import { attachBookingsToUser, createSession, findUserByEmail, verifyPassword } from "@/lib/server-store";
import { sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user)) {
    return redirectTo(request, "/account?err=login");
  }
  await attachBookingsToUser(email, user.id);
  await sessionCookie(await createSession(user.id));
  return redirectTo(request, "/account");
}
