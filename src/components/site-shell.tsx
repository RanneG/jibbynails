"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const owner = pathname.startsWith("/owner");

  return (
    <div className={cn("flex min-h-dvh flex-col overflow-x-clip bg-background", className)}>
      <SiteHeader />
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full flex-1 flex-col",
          owner ? "max-w-[1400px]" : "max-w-[1200px]"
        )}
      >
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
