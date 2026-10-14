import { promises as fs } from "fs";
import path from "path";
import { redirectTo } from "@/lib/redirect";
import { createReview, newId } from "@/lib/server-store";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = field(form, "name");
  const text = field(form, "text");
  const visitId = field(form, "visit") || undefined;
  const rating = Number(field(form, "rating") || 0);

  if (name.length < 2 || text.length < 8 || rating < 1 || rating > 5) {
    return redirectTo(request, "/review?err=details");
  }

  let photoUrl: string | undefined;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES || !TYPES[photo.type]) {
      return redirectTo(request, "/review?err=photo");
    }
    const ext = TYPES[photo.type];
    const fileName = `${newId("pic")}${ext}`;
    const dest = path.join(process.cwd(), "public", "reviews", fileName);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await photo.arrayBuffer()));
    photoUrl = `/reviews/${fileName}`;
  }

  const review = await createReview({ name, rating, text, photoUrl, visitId });
  if (review.visibility === "public") {
    return redirectTo(request, "/reviews");
  }
  return redirectTo(request, "/review?sent=private");
}
