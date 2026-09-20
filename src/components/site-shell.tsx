import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-dvh flex-col overflow-x-hidden bg-background", className)}>
      <SiteHeader />
      <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">{children}</div>
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
    </div>
  );
}
