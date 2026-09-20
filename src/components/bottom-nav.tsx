"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, House, ReceiptText, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/menu", label: "Menu", icon: ReceiptText },
  { href: "/book", label: "Book", icon: CalendarHeart },
  { href: "/reviews", label: "Reviews", icon: Sparkles },
  { href: "/account", label: "You", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      <ul className="grid grid-cols-5 rounded-full border border-ink/10 bg-card/90 p-1 shadow-[0_12px_30px_rgba(80,40,70,0.08)] backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "press flex flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[10px] tracking-wide",
                  active ? "bg-ink text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
