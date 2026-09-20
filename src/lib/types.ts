export type Intent = "new" | "infill" | "removal" | "repair" | "recreate";
export type OnNails = "bare" | "jibby" | "foreign" | "gel";
export type Family = "acrylic" | "gelx" | "biab" | "gelmani";
export type Length = "overlay" | "miniMedium" | "longXl" | "xxl";
export type Design =
  | "none"
  | "french"
  | "tier1"
  | "tier2"
  | "tier3"
  | "tier4"
  | "freestyle"
  | "moodboard";

export type WizardStep =
  | "intent"
  | "nails"
  | "service"
  | "length"
  | "design"
  | "extras"
  | "when"
  | "details";

export type Draft = {
  intent?: Intent;
  onNails?: OnNails;
  family?: Family;
  length?: Length;
  design?: Design;
  soakOff: boolean;
  chrome: boolean;
  gelxBiab: boolean;
  missingNails: number;
  notes: string;
  inspo: string;
  date?: string;
  time?: string;
  name: string;
  phone: string;
  email: string;
  firstVisit: boolean;
};

export type PriceLine = {
  label: string;
  amount: number;
  minutes: number;
};

export type Quote = {
  lines: PriceLine[];
  total: number;
  minutes: number;
  warnings: string[];
  summary: string;
};

export type Booking = {
  id: string;
  createdAt: string;
  draft: Draft;
  quote: Quote;
  status: "confirmed";
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  serviceLabel: string;
  createdAt: string;
  visitId?: string;
  wearWeeks?: string;
};

export const emptyDraft = (): Draft => ({
  soakOff: false,
  chrome: false,
  gelxBiab: false,
  missingNails: 0,
  notes: "",
  inspo: "",
  name: "",
  phone: "",
  email: "",
  firstVisit: true,
});

