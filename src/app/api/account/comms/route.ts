import { redirectTo } from "@/lib/redirect";
import { updateComms } from "@/lib/server-store";
import { currentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return redirectTo(request, "/account");
  const form = await request.formData();
  await updateComms(user.id, { sms: form.has("sms"), email: form.has("email") });
  return redirectTo(request, "/account?saved=1");
}
