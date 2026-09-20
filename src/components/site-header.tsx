"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/book", label: "Book" },
  { href: "/reviews", label: "Reviews" },
  { href: "/account", label: "You" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-ink/10 bg-background/90 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-[4.35rem] w-full max-w-[1200px] items-center gap-5 px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full border border-ink/15"
          />
          <span className="font-heading text-[1.9rem] leading-none">Jibbynails</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1" aria-label="Primary">
          {links.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const book = item.href === "/book";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "press rounded-full px-3.5 py-2 text-sm tracking-wide",
                  book
                    ? "bg-ink text-primary-foreground"
                    : active
                      ? "bg-ink/8 text-ink"
                      : "text-ink hover:bg-ink/5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <SocialLinks compact />
      </div>
    </header>
  );
}
