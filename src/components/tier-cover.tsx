import Image from "next/image";
import { coverForTier, tierSwatches } from "@/lib/sets";
import { cn } from "@/lib/utils";

/**
 * The picture for a tier. Photo when the gallery has one, colour chips for a
 * plain-colour tier. The parent sets the size and aspect via `className`.
 */
export function TierCover({
  hours,
  className,
  priority,
}: {
  hours: number;
  className?: string;
  priority?: boolean;
}) {
  const cover = coverForTier(hours);
  return (
    <div className={cn("relative overflow-hidden bg-card", className)}>
      {cover ? (
        <Image src={cover.src} alt={cover.alt} fill priority={priority} className="object-cover" />
      ) : (
        <div
          className="absolute inset-0 grid grid-cols-3 content-center gap-[8%] p-[12%]"
          role="img"
          aria-label="Plain colour swatches"
        >
          {tierSwatches.map((swatch) => (
            <span
              key={swatch.name}
              title={swatch.name}
              className="aspect-square rounded-full border border-ink/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.06)]"
              style={{ background: swatch.hex }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
