import { clearOwnerCookie } from "@/lib/owner";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: Request) {
  await clearOwnerCookie();
  return redirectTo(request, "/owner/login");
}
