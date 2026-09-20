import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

const items = [
  { href: studio.instagram, label: "Instagram", icon: "ig" },
  { href: studio.facebook, label: "Facebook", icon: "fb" },
  { href: studio.tiktok, label: "TikTok", icon: "tt" },
] as const;

function Icon({ kind }: { kind: string }) {
  if (kind === "ig") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "fb") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        <path d="M14.2 8.15h2.55V5.2h-2.55C11.6 5.2 9.7 7 9.7 9.7v1.85H7.4v2.95h2.3V21h3.35v-6.5h2.55l.55-2.95h-3.1V9.75c0-.9.45-1.6 1.15-1.6Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M14.85 3c.14 1.48.74 2.8 1.76 3.82 1.02 1.02 2.37 1.62 3.89 1.76v3.1a8.7 8.7 0 0 1-3.95-1.1v5.55c0 3.25-2.58 5.92-5.83 6.05A5.98 5.98 0 0 1 4.7 16.7c.1-3.28 2.82-5.9 6.1-5.9.33 0 .65.03.97.08v3.2a2.85 2.85 0 0 0-1.1-.16 2.78 2.78 0 0 0-2.68 2.88 2.76 2.76 0 0 0 2.76 2.68c1.53 0 2.78-1.23 2.78-2.76V3h1.32Z" />
    </svg>
  );
}

export function SocialLinks({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <nav className={cn("flex flex-wrap items-center justify-center gap-2", className)} aria-label="Social">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={cn(
            "press inline-flex items-center justify-center rounded-full border-[1.5px] border-ink text-ink",
            compact ? "size-10" : "size-11"
          )}
        >
          <Icon kind={item.icon} />
        </a>
      ))}
    </nav>
  );
}
