import { consultLengths } from "./hours";
import { setsHref } from "./sets";

export type MenuItem = {
  name: string;
  price: string;
  note?: string;
  /** Where the row goes when tapped, e.g. the tier’s photos. */
  href?: string;
};

export type MenuGroup = {
  title: string;
  blurb?: string;
  items: MenuItem[];
};

export const featured = [
  { name: "Acrylic · mini–medium", price: "£30" },
  { name: "Gel-X · mini–medium", price: "£32" },
  { name: "BIAB overlay", price: "£30" },
  { name: "Consultation", price: "from £15" },
] as const;

export const menu: MenuGroup[] = [
  {
    title: "Consultation",
    blurb:
      "The range is the set on the day, from a plain one to one with the extras that tier covers. The deposit to hold the chair is still £15 an hour.",
    items: consultLengths.map((item) => ({
      name: `${item.tier} · ${item.name}`,
      price: item.setRange,
      note: `${item.label}. ${item.detail} Tap to see examples.`,
      href: setsHref(item),
    })),
  },
  {
    title: "Acrylics",
    blurb: "A hard tip, for when you want length that lasts. Infill every 3½–4 weeks.",
    items: [
      { name: "Overlay", price: "£28", note: "Colour on your own nails, no extra length. About 1 hour — a solid colour is Tier 0." },
      { name: "Full set · mini–medium", price: "£30", note: "About 1 hour. A solid colour is Tier 0. French or a little art is Tier 1." },
      { name: "Full set · long–XL", price: "£35", note: "About 1½ hours. Book Tier 1, or Tier 2 for more art or charms." },
      { name: "Full set · XXL+", price: "£40", note: "About 2 hours. Very long, or with art, needs Tier 3. Ask first." },
      { name: "Infill", price: "£27", note: "About 1 hour on her sets, with normal growth. The same colour is Tier 0." },
    ],
  },
  {
    title: "Gel-X",
    blurb: "A soft gel tip — length without the weight of acrylic. Infill every 2 weeks.",
    items: [
      { name: "Mini–medium", price: "£32", note: "About 1 hour. A solid colour is Tier 0. A little art is Tier 1." },
      { name: "Long–XL", price: "£35", note: "About 1 hour before art. Tier 1 for a little art, Tier 2 if it’s busier." },
      { name: "XXL+", price: "£40", note: "About 1–2 hours. Ask first — XXL that needs the whole chair is Tier 3." },
      { name: "BIAB base under Gel-X", price: "+£10", note: "A stronger base under the tips. Adds about 20 minutes, so a plain set may need Tier 1." },
    ],
  },
  {
    title: "BIAB",
    blurb: "Builder gel on your own nails, for strength more than length. Medium is the longest, and infills are every 2.5–3.5 weeks.",
    items: [
      { name: "Overlay", price: "£30", note: "About 1 hour. A solid colour is Tier 0." },
      { name: "Infill", price: "£27", note: "About 1 hour on her sets." },
      { name: "Extensions · mini–medium", price: "£35", note: "About 1 hour 20, and medium is the longest. A plain shape is Tier 1. Art may need Tier 2." },
    ],
  },
  {
    title: "Gel",
    blurb: "Colour cured on your natural nails. It needs a design on top — a plain gel manicure isn’t offered.",
    items: [
      { name: "Gel manicure", price: "£30", note: "About 1 hour, plus the design. A little art is Tier 1. Intricate work needs a longer tier." },
      { name: "Gel redo", price: "£32", note: "About 1 hour to remove old gel and start again. Book the tier the new design needs." },
    ],
  },
  {
    title: "Designs",
    blurb:
      "Art sits on top of the set and adds time. A little art is Tier 1, busier art is Tier 2, and intricate work that needs the whole chair is Tier 3.",
    items: [
      { name: "French, solid or ombré", price: "+£10", note: "A tip line or a blend, not a picture. Adds about 30 minutes. Book Tier 1. One plain colour is Tier 0, not this." },
      { name: "A little art", price: "+£15", note: "A few simple details, not a scene. Adds about 30 minutes. Book Tier 1, Cute & Simple." },
      { name: "Intricate", price: "+£20", note: "Drawing on more of the nail. Adds 45–60 minutes. Book Tier 2, or Tier 3 if it needs the whole chair." },
      { name: "Advanced", price: "+£25", note: "Adds about an hour. Book Tier 2, or Tier 3 if the set is already long." },
      { name: "Masterpiece", price: "+£30", note: "Detailed art across the set. An hour or more. Book Tier 3." },
      { name: "Jibby’s choice", price: "+£33", note: "She designs it, add-ons included. About 1½ hours. Book Tier 2, or Tier 3 if you want it elaborate." },
      { name: "Mood-board freestyle", price: "+£35", note: "From your photos, add-ons included. About 1½ hours is Tier 2. An elaborate board is Tier 3." },
    ],
  },
  {
    title: "Recreate",
    blurb: "She copies a photo, and confirms the price from it. A recreate needs Tier 3 — the 3-hour chair.",
    items: [
      { name: "Overlay / mini", price: "from £50", note: "Shorter nails, still a full copy. Book Tier 3. Price confirmed from your photo." },
      { name: "Short–medium", price: "from £50", note: "Book Tier 3. Price confirmed from your photo." },
      { name: "Long–XL", price: "from £55", note: "Longer nails. Extra detail can use the whole 3 hours. Book Tier 3. Price confirmed from your photo." },
    ],
  },
  {
    title: "Soak off",
    blurb: "Removal on its own, or before a new set. A soak off with a new set does not fit Tier 0 — book Tier 2 or longer.",
    items: [
      { name: "Soak off", price: "£10", note: "About 30 minutes, no new set. The shortest slot is still Tier 0 (1 hour)." },
      { name: "Soak off with a new set", price: "£7", note: "About 30 minutes, then the set. That is Tier 2 at least, not Tier 0." },
      { name: "Foreign soak off", price: "£15", note: "Another tech’s set. About 30–45 minutes, no new set." },
      { name: "Foreign soak off with a new set", price: "£12", note: "About 30–45 minutes, then the set. Book Tier 2, or Tier 3 if the new set is detailed or XXL." },
    ],
  },
  {
    title: "Repairs & extras",
    blurb: "A few snapped tips on a set she did. More than five is a new set. Chrome is a finish on the tier you already need.",
    items: [
      { name: "Replacement extension", price: "£1 each", note: "A few minutes each. One or two can stay in your tier. More than five is a full set." },
      { name: "Chrome", price: "+£5", note: "A mirror finish. Adds about 10 minutes. Stay in the tier the set already needs." },
    ],
  },
];
