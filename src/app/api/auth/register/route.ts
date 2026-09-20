import { redirectTo } from "@/lib/redirect";
import { attachBookingsToUser, createSession, createUser } from "@/lib/server-store";
import { sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const password = String(form.get("password") || "");

  if (name.length < 2 || !email.includes("@") || phone.length < 10 || password.length < 6) {
    return redirectTo(request, "/account?mode=create&err=details");
  }

  const created = await createUser({ name, email, phone, password });
  if (!created.ok) {
    return redirectTo(request, "/account?mode=create&err=exists");
  }

  await attachBookingsToUser(email, created.user.id);
  await sessionCookie(await createSession(created.user.id));
  return redirectTo(request, "/account");
}
