import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { menu } from "@/lib/menu";

export const metadata = {
  title: "Menu — Jibbynails",
};

export default function MenuPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">
        <p className="eyebrow">Prices</p>
        <h1 className="font-heading mt-1.5 text-[2.15rem] leading-none tracking-tight">Menu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Book a consultation at £15 / hour. These are the set prices.
        </p>
        <div className="mt-7 space-y-8">
          {menu.map((group) => (
            <section key={group.title}>
              <div className="flex items-end gap-3">
                <h2 className="font-heading text-[1.45rem] leading-none">{group.title}</h2>
                <span className="mb-1 h-px flex-1 bg-gold/25" />
              </div>
              {group.blurb ? (
                <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
              ) : null}
              <ul className="surface mt-3 divide-y divide-ink/8 overflow-hidden rounded-2xl">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-4 px-4 py-3.5">
                    <span>
                      <span className="block text-sm">{item.name}</span>
                      {item.note ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.note}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-gold">{item.price}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <div className="sticky bottom-[4.4rem] z-20 px-5 pb-3">
        <Link href="/book" className="btn-gold w-full shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          Book consultation
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
