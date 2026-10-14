import { isOwner } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";
import { setClientNote } from "@/lib/server-store";

export async function POST(request: Request) {
  if (!(await isOwner())) return redirectTo(request, "/owner/login");
  const form = await request.formData();
  const key = String(form.get("key") || "").trim().toLowerCase();
  if (!key) return redirectTo(request, "/owner/clients");
  await setClientNote(key, String(form.get("note") || "").slice(0, 600));
  return redirectTo(request, `/owner/clients/${encodeURIComponent(key)}?saved=1`);
}
