"use client";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  readOnly,
  size = "md",
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "leading-none",
            size === "sm" ? "text-lg" : "text-2xl",
            n <= value ? "text-ink" : "text-ink/25"
          )}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
