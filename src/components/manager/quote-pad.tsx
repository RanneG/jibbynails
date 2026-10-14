"use client";

import { useMemo, useState } from "react";
import { consultRate } from "@/lib/hours";
import {
  catalogDesigns,
  catalogLengths,
  defaultSoak,
  families,
  formatDuration,
  formatMoney,
  intents,
  nailStates,
  quoteDraft,
  quoteInvoice,
  shouldOfferSoak,
  visibleSteps,
} from "@/lib/pricing";
import type { Design, Draft, Family, Intent, Length } from "@/lib/types";
import { emptyDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuotePad() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [client, setClient] = useState("");
  const quote = useMemo(() => quoteDraft(draft), [draft]);
  const invoice = useMemo(() => quoteInvoice(quote), [quote]);
  const steps = visibleSteps(draft);
  const bundledArt = draft.design === "freestyle" || draft.design === "moodboard";

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const pickIntent = (intent: Intent) => {
    setDraft((prev) => {
      const next: Draft = { ...prev, intent };
      if (intent === "repair" || intent === "removal") {
        next.family = undefined;
        next.length = undefined;
        next.design = undefined;
        next.gelxBiab = false;
        next.chrome = false;
      }
      if (intent === "removal") next.soakOff = false;
      if (intent === "recreate") next.design = undefined;
      if (intent === "repair") next.missingNails = prev.missingNails || 1;
      return next;
    });
  };

  const pickNails = (onNails: NonNullable<Draft["onNails"]>) => {
    setDraft((prev) => {
      const next = { ...prev, onNails };
      next.soakOff = defaultSoak(next);
      return next;
    });
  };

  const pickFamily = (family: Family) => {
    setDraft((prev) => {
      const lengths = catalogLengths(family);
      const length = lengths.some((item) => item.id === prev.length) ? prev.length : lengths[0]?.id;
      return { ...prev, family, length, gelxBiab: family === "gelx" ? prev.gelxBiab : false };
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-7">
        <label className="block text-sm">
          For
          <input
            value={client}
            onChange={(event) => setClient(event.target.value)}
            placeholder="Optional — their name on the estimate"
            className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 outline-none focus:border-ink"
          />
        </label>

        <Choices
          label="Visit"
          value={draft.intent}
          options={intents}
          onChange={pickIntent}
        />

        {draft.intent && draft.intent !== "repair" ? (
          <Choices label="On the nails" value={draft.onNails} options={nailStates} onChange={pickNails} />
        ) : null}

        {draft.intent && steps.includes("service") ? (
          <Choices
            label="Set"
            value={draft.family}
            options={families}
            onChange={pickFamily}
          />
        ) : null}

        {draft.intent && steps.includes("length") && draft.family && draft.family !== "gelmani" ? (
          <Choices
            label="Length"
            value={draft.length}
            options={catalogLengths(draft.family).map((item) => ({
              id: item.id,
              label: item.label,
              price: formatMoney(item.amount),
            }))}
            onChange={(length: Length) => set({ length })}
          />
        ) : null}

        {draft.intent && steps.includes("design") ? (
          <Choices
            label="Art"
            value={draft.design ?? "none"}
            options={catalogDesigns().map((item) => ({
              id: item.id,
              label: item.label,
              price: item.amount ? `+${formatMoney(item.amount)}` : undefined,
            }))}
            onChange={(design: Design) => set({ design: design === "none" ? undefined : design })}
          />
        ) : null}

        {draft.intent === "repair" ? (
          <div>
            <p className="eyebrow">Snapped nails</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                className="press flex size-11 items-center justify-center rounded-full border border-ink/15 text-lg"
                onClick={() => set({ missingNails: Math.max(0, draft.missingNails - 1) })}
              >
                −
              </button>
              <p className="min-w-8 text-center text-lg font-medium">{draft.missingNails}</p>
              <button
                type="button"
                className="press flex size-11 items-center justify-center rounded-full border border-ink/15 text-lg"
                onClick={() => set({ missingNails: Math.min(5, draft.missingNails + 1) })}
              >
                +
              </button>
              <p className="text-sm text-muted-foreground">£1 each · more than five is a new set</p>
            </div>
          </div>
        ) : null}

        {draft.intent && draft.intent !== "removal" && draft.intent !== "repair" &&
        (shouldOfferSoak(draft) || (draft.family === "gelx" && !bundledArt) || !bundledArt) ? (
          <div>
            <p className="eyebrow">Extras</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shouldOfferSoak(draft) ? (
                <Toggle
                  on={draft.soakOff}
                  label={draft.onNails === "foreign" ? "Foreign soak off" : "Soak off"}
                  price={soakPrice(draft)}
                  onClick={() => set({ soakOff: !draft.soakOff })}
                />
              ) : null}
              {draft.family === "gelx" && draft.intent !== "recreate" && !bundledArt ? (
                <Toggle
                  on={draft.gelxBiab}
                  label="BIAB under Gel-X"
                  price="+£10"
                  onClick={() => set({ gelxBiab: !draft.gelxBiab })}
                />
              ) : null}
              {!bundledArt ? (
                <Toggle
                  on={draft.chrome}
                  label="Chrome"
                  price="+£5"
                  onClick={() => set({ chrome: !draft.chrome })}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setDraft(emptyDraft());
            setClient("");
          }}
          className="press text-sm text-muted-foreground underline decoration-ink/30 underline-offset-4"
        >
          Clear estimate
        </button>
      </div>

      <aside className="lg:sticky lg:top-4">
        <div className="surface rounded-3xl p-5">
          <p className="eyebrow">Estimate</p>
          <h2 className="font-heading mt-1 text-[2.2rem] leading-none">Invoice</h2>
          {client.trim() ? <p className="mt-2 text-sm">{client.trim()}</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">Guide for the set. Not a bill.</p>

          {quote.lines.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {quote.warnings[0] || "Tap what they want. The lines fill in."}
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-ink/8">
              {quote.lines.map((line, index) => (
                <li key={`${line.label}-${index}`} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block">{line.label}</span>
                    {line.minutes ? (
                      <span className="text-xs text-muted-foreground">{formatDuration(line.minutes)}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 flex items-baseline justify-between border-t border-ink/15 pt-3 text-lg font-medium">
            <span>Set</span>
            <span className="tabular-nums">{quote.total ? formatMoney(quote.total) : "—"}</span>
          </p>

          {invoice.slot && quote.total > 0 ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Book the chair</dt>
                <dd className="text-right">
                  {invoice.slot.tier} · {invoice.slot.label}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Deposit · £{consultRate}/hr</dt>
                <dd className="tabular-nums">{formatMoney(invoice.deposit)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cash on the day</dt>
                <dd className="tabular-nums">{formatMoney(invoice.balance)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Time on the chair</dt>
                <dd>{formatDuration(quote.minutes)}</dd>
              </div>
            </dl>
          ) : null}

          {quote.warnings.length > 0 && quote.lines.length > 0 ? (
            <ul className="mt-4 space-y-1.5 text-xs leading-5 text-muted-foreground">
              {quote.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            She confirms from the photo. Balance in cash. Deposit holds the slot.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Choices<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: T;
  options: { id: T; label: string; price?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const on = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "press rounded-full border px-3.5 py-2 text-left text-sm",
                on ? "border-ink bg-ink text-card" : "border-ink/15 bg-card"
              )}
            >
              {option.label}
              {option.price ? <span className={cn("ml-1.5", on ? "text-card/70" : "text-muted-foreground")}>{option.price}</span> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function soakPrice(draft: Draft) {
  const foreign = draft.onNails === "foreign";
  const withSet = draft.intent !== "removal";
  if (foreign && withSet) return "+£12";
  if (foreign) return "£15";
  if (withSet) return "+£7";
  return "£10";
}

function Toggle({
  on,
  label,
  price,
  onClick,
}: {
  on: boolean;
  label: string;
  price: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-full border px-3.5 py-2 text-sm",
        on ? "border-ink bg-ink text-card" : "border-ink/15 bg-card"
      )}
    >
      {label}
      <span className={cn("ml-1.5", on ? "text-card/70" : "text-muted-foreground")}>{price}</span>
    </button>
  );
}
