import { redirect } from "next/navigation";
import { isOwner } from "@/lib/owner";

export const metadata = {
  title: "Manager — Jibbynails",
};

export const dynamic = "force-dynamic";

export default async function OwnerLoginPage({ searchParams }: PageProps<"/owner/login">) {
  if (await isOwner()) redirect("/owner");
  const raw = await searchParams;
  const err = Array.isArray(raw.err) ? raw.err[0] : raw.err;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-16 text-center">
      <h1 className="font-heading text-[2.8rem] leading-none">Manager</h1>
      <p className="mt-3 text-sm tracking-wide text-muted-foreground">Your bookings, clients, and hours.</p>
      {err === "key" ? <p className="mt-4 text-sm text-destructive">That key didn’t match.</p> : null}
      <form action="/api/owner/login" method="post" className="mt-6 space-y-3">
        <input
          name="key"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Owner key"
          className="h-12 w-full rounded-full border border-input bg-card px-4 text-center outline-none focus:border-ink"
        />
        <button type="submit" className="btn-gold w-full">
          Open manager
        </button>
      </form>
      <p className="mt-6 text-xs text-muted-foreground">Stays signed in on this device for 90 days.</p>
    </main>
  );
}
