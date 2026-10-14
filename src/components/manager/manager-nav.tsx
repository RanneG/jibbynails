"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, House, ReceiptText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/owner", label: "Today", icon: House, match: ["/owner", "/owner/notes"] },
  { href: "/owner/schedule", label: "Schedule", icon: CalendarDays, match: ["/owner/schedule", "/owner/booking"] },
  { href: "/owner/clients", label: "Clients", icon: Users, match: ["/owner/clients"] },
  { href: "/owner/quote", label: "Quote", icon: ReceiptText, match: ["/owner/quote"] },
  { href: "/owner/hours", label: "Hours", icon: Clock3, match: ["/owner/hours"] },
];

function isActivePath(pathname: string, item: (typeof items)[number]) {
  return item.match.some((prefix) => (prefix === "/owner" ? pathname === "/owner" : pathname.startsWith(prefix)));
}

function Badge({ count, inverted }: { count: number; inverted?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
        inverted ? "bg-card text-ink" : "bg-ink text-card"
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function ManagerShell({
  newCount = 0,
  children,
}: {
  newCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-ink/10 bg-card/50 px-3 py-5 lg:flex">
        <Link href="/owner" className="flex items-center gap-2.5 px-3 pb-6">
          <Image
            src="/brand/logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full border border-ink/15"
          />
          <span>
            <span className="block font-heading text-[1.65rem] leading-none">Jibbynails</span>
            <span className="eyebrow mt-1 block">Manager</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Manager">
          {items.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            const showBadge = item.href === "/owner" && newCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm tracking-wide",
                  active ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:bg-ink/5 hover:text-ink"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  {showBadge ? (
                    <span className="absolute -right-1.5 -top-1.5">
                      <Badge count={newCount} inverted={active} />
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-1 px-1 pt-6 text-xs text-muted-foreground">
          <Link href="/" className="press block rounded-full px-3 py-1.5 hover:text-ink">
            View site
          </Link>
          <form action="/api/owner/logout" method="post">
            <button type="submit" className="press block w-full rounded-full px-3 py-1.5 text-left hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
          <p className="eyebrow">Manager</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="press rounded-full px-3 py-1.5 hover:text-ink">
              View site
            </Link>
            <form action="/api/owner/logout" method="post">
              <button type="submit" className="press rounded-full px-3 py-1.5 hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="flex-1">{children}</div>

        <nav
          className="sticky bottom-0 z-30 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
          aria-label="Manager"
        >
          <div className="mx-auto flex max-w-2xl rounded-full border border-ink/10 bg-card/90 p-1 shadow-[0_12px_30px_rgba(80,40,70,0.08)] backdrop-blur-xl">
            {items.map((item) => {
              const active = isActivePath(pathname, item);
              const Icon = item.icon;
              const showBadge = item.href === "/owner" && newCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "press relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[10px] tracking-wide",
                    active ? "bg-ink text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                    {showBadge ? (
                      <span className="absolute -right-2 -top-1.5">
                        <Badge count={newCount} inverted={active} />
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
