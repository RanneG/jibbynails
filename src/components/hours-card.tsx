import { ChevronDown } from "lucide-react";
import { openingStatus, typicalHoursLabel, weekFromToday } from "@/lib/hours";
import { cn } from "@/lib/utils";

export function HoursCard() {
  const status = openingStatus();
  const week = weekFromToday();

  return (
    <details className="hours-drop overflow-hidden rounded-2xl border border-ink/10 bg-card/95 shadow-[0_16px_40px_rgba(80,55,35,0.08)] backdrop-blur-md">
      <summary
        data-hours-toggle
        className="press flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            "status-dot size-2.5 shrink-0 rounded-full",
            status.open ? "bg-emerald-400" : "bg-red-500"
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-tight">{status.label}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{status.next}</span>
        </span>
        <span
          data-hours-chevron
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/6 text-muted-foreground transition-transform duration-300"
        >
          <ChevronDown className="size-4" />
        </span>
      </summary>

      <div className="border-t border-ink/8 px-4 pb-3.5 pt-3">
        <p className="text-[12px] text-muted-foreground">{typicalHoursLabel()}</p>
        <ul className="mt-3 space-y-2.5">
          {week.map((day) => (
            <li key={day.name} className="flex items-baseline justify-between gap-3 text-sm">
              <span className={day.isToday ? "font-medium text-ink" : "text-muted-foreground"}>
                {day.name}
                {day.isToday ? " (today)" : ""}
              </span>
              <span className={day.closed ? "text-muted-foreground" : "text-gold"}>
                {day.hours}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
