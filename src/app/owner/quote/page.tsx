import { QuotePad } from "@/components/manager/quote-pad";
import { requireOwner } from "@/lib/owner";

export const metadata = {
  title: "Quote — Manager",
};

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  await requireOwner();

  return (
    <main className="flex-1 px-5 pb-8 pt-4 lg:px-8">
      <h1 className="font-heading text-[2.8rem] leading-none">Quote</h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground">
        Tap the set in front of them. Same prices as the menu. Show them the invoice before they book.
      </p>
      <div className="mt-6">
        <QuotePad />
      </div>
    </main>
  );
}
