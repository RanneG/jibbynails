import { consultByHours, consultLengths, consultRate, durationLabel, tierTitle } from "./hours";

export type BookStep = "tier" | "when" | "details";

export type BookState = {
  hours?: number;
  date?: string;
  time?: string;
  month?: string;
  step: BookStep;
};

export function bookFromParams(params: URLSearchParams): BookState {
  const parsed = Number(params.get("h"));
  const hours = consultByHours(parsed)?.hours;
  const date = params.get("day") || undefined;
  const time = params.get("tm") || undefined;
  const requested = params.get("s");
  let step: BookStep = "tier";
  if (!hours || requested === "tier") step = "tier";
  else if (requested === "details" && date && time) step = "details";
  else step = "when";
  return {
    hours,
    date,
    time,
    month: params.get("m") || (date ? date.slice(0, 7) : undefined),
    step,
  };
}

export function bookHref(state: Partial<BookState>) {
  const p = new URLSearchParams();
  const tier = state.hours != null ? consultByHours(state.hours) : undefined;
  if (state.step) p.set("s", state.step);
  if (tier) p.set("h", String(tier.hours));
  if (state.date) p.set("day", state.date);
  if (state.time) p.set("tm", state.time);
  if (state.month) p.set("m", state.month);
  const query = p.toString();
  return query ? `/book?${query}` : "/book";
}

export function consultQuote(hours: number) {
  const mins = Math.round(hours * 60);
  const tier = consultLengths.find((item) => item.hours === hours);
  const label = tier ? tierTitle(tier.hours) : `Consultation · ${durationLabel(hours)}`;
  return {
    lines: [{ label, amount: hours * consultRate, minutes: mins }],
    total: hours * consultRate,
    minutes: mins,
    warnings: [] as string[],
    summary: label,
  };
}
