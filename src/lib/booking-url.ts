import { consultLengths, consultRate } from "./hours";

export type BookState = {
  hours: number;
  date?: string;
  time?: string;
  month?: string;
  step: "duration" | "when" | "details";
};

export function bookFromParams(params: URLSearchParams): BookState {
  const hours = Number(params.get("h") || 0);
  const valid = consultLengths.some((item) => item.hours === hours);
  const date = params.get("day") || undefined;
  return {
    hours: valid ? hours : 0,
    date,
    time: params.get("tm") || undefined,
    month: params.get("m") || (date ? date.slice(0, 7) : undefined),
    step: (params.get("s") as BookState["step"]) || "duration",
  };
}

export function bookHref(state: Partial<BookState> & { hours?: number }) {
  const p = new URLSearchParams();
  if (state.step) p.set("s", state.step);
  if (state.hours) p.set("h", String(state.hours));
  if (state.date) p.set("day", state.date);
  if (state.time) p.set("tm", state.time);
  if (state.month) p.set("m", state.month);
  return `/book?${p.toString()}`;
}

export function consultQuote(hours: number) {
  const mins = hours * 60;
  const length = consultLengths.find((item) => item.hours === hours);
  const label = length?.label ?? (hours === 1 ? "1 hour" : `${hours} hours`);
  return {
    lines: [{ label: `Consultation · ${label}`, amount: hours * consultRate, minutes: mins }],
    total: hours * consultRate,
    minutes: mins,
    warnings: [] as string[],
    summary: `Consultation · ${label}`,
  };
}
