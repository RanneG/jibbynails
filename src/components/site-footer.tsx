"use client";

import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";
import { studio } from "@/lib/studio";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/owner")) return null;

  return (
    <footer className="mt-auto hidden border-t border-ink/10 md:block">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-8">
        <p className="text-sm tracking-wide text-muted-foreground">
          Strood · ME2 ·{" "}
          <a href={`mailto:${studio.email}`} className="hover:text-ink">
            {studio.email}
          </a>
        </p>
        <SocialLinks compact />
      </div>
    </footer>
  );
}
