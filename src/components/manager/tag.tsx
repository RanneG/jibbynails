import type { Tag as TagShape, Tone } from "@/lib/manager";
import { cn } from "@/lib/utils";

const tones: Record<Tone, string> = {
  ink: "bg-ink text-card",
  pink: "bg-pink text-ink",
  sky: "bg-sky text-ink",
  muted: "bg-ink/8 text-muted-foreground",
  line: "border border-ink/20 text-ink",
};

export function Tag({ label, tone }: TagShape) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide", tones[tone])}>
      {label}
    </span>
  );
}

export function Tags({ tags }: { tags: TagShape[] }) {
  if (tags.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Tag key={tag.label} {...tag} />
      ))}
    </span>
  );
}
