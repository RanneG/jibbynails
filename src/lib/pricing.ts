import type { Draft, Family, Length, Quote, WizardStep } from "./types";

const base: Record<
  Family,
  Partial<Record<Length | "infill" | "redo", { amount: number; minutes: number; label: string }>>
> = {
  acrylic: {
    overlay: { amount: 28, minutes: 60, label: "Acrylic overlay" },
    miniMedium: { amount: 30, minutes: 60, label: "Acrylic full set, mini–medium" },
    longXl: { amount: 35, minutes: 90, label: "Acrylic full set, long–XL" },
    xxl: { amount: 40, minutes: 120, label: "Acrylic full set, XXL" },
    infill: { amount: 27, minutes: 60, label: "Acrylic infill" },
  },
  gelx: {
    miniMedium: { amount: 32, minutes: 60, label: "Gel-X, mini–medium" },
    longXl: { amount: 35, minutes: 60, label: "Gel-X, long–XL" },
    xxl: { amount: 40, minutes: 60, label: "Gel-X, XXL" },
    infill: { amount: 32, minutes: 60, label: "Gel-X infill (same length)" },
  },
  biab: {
    overlay: { amount: 30, minutes: 60, label: "BIAB overlay" },
    miniMedium: { amount: 35, minutes: 80, label: "BIAB extensions, mini–medium" },
    infill: { amount: 27, minutes: 60, label: "BIAB infill" },
  },
  gelmani: {
    overlay: { amount: 30, minutes: 60, label: "Gel manicure" },
    redo: { amount: 32, minutes: 60, label: "Gel redo" },
  },
};

const recreate: Record<Length, { amount: number; minutes: number; label: string }> = {
  overlay: { amount: 50, minutes: 120, label: "Recreate, overlay / mini" },
  miniMedium: { amount: 50, minutes: 120, label: "Recreate, short–medium" },
  longXl: { amount: 55, minutes: 150, label: "Recreate, long–XL" },
  xxl: { amount: 60, minutes: 150, label: "Recreate, XL+" },
};

const designPrices: Record<
  string,
  { amount: number; minutes: number; label: string; includesAddons?: boolean }
> = {
  none: { amount: 0, minutes: 0, label: "No extra art" },
  french: { amount: 10, minutes: 30, label: "French, solid or ombré" },
  tier1: { amount: 15, minutes: 30, label: "A little art" },
  tier2: { amount: 20, minutes: 60, label: "Intricate art" },
  tier3: { amount: 25, minutes: 80, label: "Advanced art" },
  tier4: { amount: 30, minutes: 90, label: "Masterpiece art" },
  freestyle: {
    amount: 33,
    minutes: 90,
    label: "Jibby’s choice (add-ons included)",
    includesAddons: true,
  },
  moodboard: {
    amount: 35,
    minutes: 90,
    label: "Mood-board freestyle (add-ons included)",
    includesAddons: true,
  },
};

export function quoteDraft(draft: Draft): Quote {
  const lines: Quote["lines"] = [];
  const warnings: string[] = [];

  if (draft.intent === "repair") {
    const n = Math.min(5, Math.max(0, draft.missingNails));
    if (n === 0) {
      return {
        lines: [],
        total: 0,
        minutes: 0,
        warnings: ["Tell her how many nails snapped."],
        summary: "Repair",
      };
    }
    const minutes = n >= 5 ? 10 : n >= 3 ? 7 : 5;
    lines.push({
      label: n === 1 ? "1 replacement extension" : `${n} replacement extensions`,
      amount: n,
      minutes,
    });
    if (n === 5) {
      warnings.push("More than five missing nails needs a full set, not a repair.");
    }
    return finish(lines, warnings, "Broken nail repair");
  }

  if (draft.intent === "removal") {
    const foreign = draft.onNails === "foreign";
    lines.push({
      label: foreign ? "Foreign soak off" : "Soak off",
      amount: foreign ? 15 : 10,
      minutes: 30,
    });
    return finish(lines, warnings, foreign ? "Foreign soak off" : "Soak off");
  }

  if (draft.intent === "recreate") {
    const length = draft.length ?? "miniMedium";
    const rec = recreate[length];
    lines.push({ label: rec.label, amount: rec.amount, minutes: rec.minutes });
    warnings.push(
      "Recreate price is confirmed once Jibby sees the photo. Extra-intricate A sets can be £60."
    );
    addSoak(draft, lines);
    if (draft.chrome) {
      lines.push({ label: "Chrome", amount: 5, minutes: 10 });
    }
    return finish(lines, warnings, rec.label);
  }

  const family = draft.family;
  if (!family) {
    return { lines: [], total: 0, minutes: 0, warnings, summary: "Pick a set type" };
  }

  if (draft.intent === "infill") {
    if (draft.onNails === "foreign") {
      warnings.push(
        "Infills are for Jibby’s sets. A set from another tech needs a soak off and a new set."
      );
    }
    if (family === "gelx") {
      const length = draft.length ?? "miniMedium";
      const row = base.gelx[length] ?? base.gelx.miniMedium!;
      lines.push({
        label: "Gel-X infill (booked as your length)",
        amount: row.amount,
        minutes: row.minutes,
      });
      warnings.push(
        "There’s no separate Gel-X infill on the old menu — this books the matching length so she can refill it."
      );
    } else if (family === "gelmani") {
      lines.push({ ...base.gelmani.redo! });
    } else {
      const row = base[family].infill;
      if (row) lines.push({ ...row });
    }
  } else {
    if (family === "gelmani") {
      const redo = draft.onNails === "gel" || draft.onNails === "jibby";
      lines.push({ ...(redo ? base.gelmani.redo! : base.gelmani.overlay!) });
    } else {
      const length = draft.length ?? (family === "gelx" ? "miniMedium" : "overlay");
      const row = base[family][length];
      if (row) {
        lines.push({ ...row });
      } else if (family === "biab" && (length === "longXl" || length === "xxl")) {
        warnings.push("BIAB isn’t offered past medium. Acrylic or Gel-X is better for longer sets.");
        lines.push({ ...base.biab.miniMedium! });
      }
    }
  }

  const design = draft.design ? designPrices[draft.design] : undefined;
  if (design && design.amount > 0) {
    lines.push({
      label: design.label,
      amount: design.amount,
      minutes: design.minutes,
    });
  } else if (family === "gelmani" && !draft.design) {
    warnings.push("Gel manicures need a design on top — pick a finish next.");
  }

  const includes = Boolean(design?.includesAddons);
  addSoak(draft, lines);

  if (draft.gelxBiab && family === "gelx" && !includes) {
    lines.push({
      label: "BIAB overlay under Gel-X (stronger base)",
      amount: 10,
      minutes: 20,
    });
  }
  if (draft.chrome && !includes) {
    lines.push({ label: "Chrome", amount: 5, minutes: 10 });
  }
  if (draft.missingNails > 0 && draft.intent !== "new") {
    const n = Math.min(5, draft.missingNails);
    lines.push({
      label: `${n} replacement extension${n === 1 ? "" : "s"}`,
      amount: n,
      minutes: n >= 5 ? 10 : n >= 3 ? 7 : 5,
    });
  }
  if (draft.length === "xxl") {
    warnings.push("XXL and longer should be checked on Instagram DM — price may change.");
  }

  const summary = lines[0]?.label ?? "Set";
  return finish(lines, warnings, summary);
}

function addSoak(draft: Draft, lines: Quote["lines"]) {
  if (!draft.soakOff) return;
  const foreign = draft.onNails === "foreign";
  const withSet = draft.intent !== "removal";
  if (foreign && withSet) {
    lines.push({ label: "Foreign soak off with new set", amount: 12, minutes: 30 });
  } else if (foreign) {
    lines.push({ label: "Foreign soak off", amount: 15, minutes: 30 });
  } else if (withSet) {
    lines.push({ label: "Soak off with new set", amount: 7, minutes: 30 });
  } else {
    lines.push({ label: "Soak off", amount: 10, minutes: 30 });
  }
}

function finish(lines: Quote["lines"], warnings: string[], summary: string): Quote {
  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    minutes: lines.reduce((sum, line) => sum + line.minutes, 0),
    warnings,
    summary,
  };
}

export function visibleSteps(draft: Draft): WizardStep[] {
  const steps: WizardStep[] = ["intent", "nails"];
  if (draft.intent === "repair") {
    steps.push("extras", "when", "details");
    return steps;
  }
  if (draft.intent === "removal") {
    steps.push("when", "details");
    return steps;
  }
  steps.push("service");
  const needsLength =
    draft.intent === "recreate" ||
    (draft.family !== undefined &&
      draft.family !== "gelmani" &&
      !(draft.intent === "infill" && draft.family !== "gelx"));
  if (needsLength) steps.push("length");
  if (draft.intent !== "recreate") steps.push("design");
  steps.push("extras", "when", "details");
  return steps;
}

export function formatMoney(amount: number) {
  return `£${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} hr ${mins} min`;
  if (hours) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${mins} min`;
}

export function shouldOfferSoak(draft: Draft) {
  if (draft.intent === "removal") return false;
  return draft.onNails === "foreign" || draft.onNails === "jibby" || draft.onNails === "gel";
}

export function defaultSoak(draft: Draft) {
  if (draft.intent === "removal") return false;
  if (draft.intent === "infill" && draft.onNails === "jibby") return false;
  return draft.onNails === "foreign" || (draft.intent === "new" && draft.onNails === "jibby");
}

export function serviceLabel(draft: Draft) {
  return quoteDraft(draft).summary;
}
