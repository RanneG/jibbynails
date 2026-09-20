import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn("h-12 w-full rounded-full border border-input bg-card px-4 text-sm", className)}
      {...props}
    />
  );
}
