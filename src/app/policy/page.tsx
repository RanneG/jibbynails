import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { policyPoints } from "@/lib/policy";
import { studio } from "@/lib/studio";

export const metadata = {
  title: "Policy — Jibbynails",
};

export default function PolicyPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sky">
      <main className="flex-1 px-6 pb-8 pt-10">
        <h1 className="font-heading text-center text-[3.4rem] leading-none">Policy</h1>
        <p className="pill mx-auto mt-4">Read before booking</p>
        <ol className="mt-8 space-y-4 text-sm leading-6 tracking-wide">
          {policyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
        <Link href="/book" className="btn-gold mt-8">
          Book
        </Link>
        <p className="mt-8 text-center text-sm tracking-[0.18em]">{studio.handle}</p>
      </main>
      <BottomNav />
    </div>
  );
}
