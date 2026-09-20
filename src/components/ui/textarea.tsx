import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn("min-h-28 w-full rounded-3xl border border-input bg-card p-4 text-sm", className)}
      {...props}
    />
  );
}
