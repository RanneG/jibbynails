import { isOwnerKey, setOwnerCookie } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";

async function signIn(request: Request, key: string) {
  if (!isOwnerKey(key)) return redirectTo(request, "/owner/login?err=key");
  await setOwnerCookie();
  return redirectTo(request, "/owner");
}

/** Old links still work: `/owner?key=…` lands here and becomes a cookie. */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") || "";
  return signIn(request, key);
}

export async function POST(request: Request) {
  const form = await request.formData();
  return signIn(request, String(form.get("key") || "").trim());
}
