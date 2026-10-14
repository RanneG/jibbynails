import { cn } from "@/lib/utils";

/** The one-line confirmation or error after a form submits. */
export function Banner({ message, tone = "ok" }: { message?: string; tone?: "ok" | "warn" }) {
  if (!message) return null;
  return (
    <p className={cn("mt-4 rounded-2xl px-4 py-2.5 text-sm leading-6", tone === "ok" ? "bg-sky" : "bg-pink")}>
      {message}
    </p>
  );
}
