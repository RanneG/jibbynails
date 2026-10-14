import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { menu, type MenuItem } from "@/lib/menu";

export const metadata = {
  title: "Price List — Jibbynails",
};

function Row({ item, padded }: { item: MenuItem; padded: boolean }) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-sm tracking-wide">{item.name}</span>
        {item.note ? <span className="mt-0.5 block text-xs text-muted-foreground">{item.note}</span> : null}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums">
        {item.price}
        {item.href ? <ChevronRight className="size-4 text-muted-foreground" aria-hidden /> : null}
      </span>
    </>
  );
  const className = `flex items-baseline justify-between gap-4 py-3.5 ${padded ? "px-5" : ""}`;
  if (item.href) {
    return (
      <li>
        <Link href={item.href} className={`press ${className}`} aria-label={`${item.name}, see the sets`}>
          {inner}
        </Link>
      </li>
    );
  }
  return <li className={className}>{inner}</li>;
}

export default function MenuPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-[4.35rem] z-30 hidden border-b border-ink/10 bg-background/90 px-6 py-2.5 backdrop-blur-xl md:block">
        <div className="mx-auto flex w-full max-w-[52rem] items-center justify-between gap-4">
          <p className="text-sm tracking-wide text-muted-foreground">Four slots · £15 an hour</p>
          <Link href="/book" className="btn-gold h-10 px-5">
            Book
          </Link>
        </div>
      </div>

      <main className="flex-1 px-5 pb-28 pt-8 md:mx-auto md:w-full md:max-w-[52rem] md:px-8 md:pb-16">
        <h1 className="font-heading text-center text-[3.1rem] leading-none">Price List</h1>
        <p className="mt-3 text-center text-sm tracking-wide text-muted-foreground">
          Pick a tier when you book. Times under each set are how long the work usually takes.{" "}
          <Link href="/sets" className="underline underline-offset-4">
            See the sets
          </Link>
          .
        </p>

        <div className="mt-8 space-y-8 md:hidden">
          {menu.map((group) => (
            <section key={group.title} className="text-center">
              <span className="pill">{group.title}</span>
              {group.blurb ? (
                <p className="mt-3 text-sm tracking-wide text-muted-foreground">{group.blurb}</p>
              ) : null}
              <ul className="surface mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl text-left">
                {group.items.map((item) => (
                  <Row key={item.name} item={item} padded />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 hidden space-y-5 md:block">
          {menu.map((group) => (
            <section key={group.title} className="surface overflow-hidden rounded-3xl px-7 py-6">
              <span className="pill">{group.title}</span>
              {group.blurb ? (
                <p className="mt-3 text-sm tracking-wide text-muted-foreground">{group.blurb}</p>
              ) : null}
              <ul className="mt-4 divide-y divide-ink/8">
                {group.items.map((item) => (
                  <Row key={item.name} item={item} padded={false} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <div className="sticky bottom-[4.4rem] z-20 px-5 pb-3 md:hidden">
        <Link href="/book" className="btn-gold w-full shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          Book a slot
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
