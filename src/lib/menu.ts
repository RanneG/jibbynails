export type MenuItem = {
  name: string;
  price: string;
  note?: string;
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
  { name: "Consultation", price: "£15 / hr" },
] as const;

export const menu: MenuGroup[] = [
  {
    title: "Consultation",
    blurb: "Book chair time. We’ll pick the set together.",
    items: [{ name: "Consultation", price: "£15 / hour" }],
  },
  {
    title: "Acrylics",
    blurb: "Strong. Infill every 3½–4 weeks.",
    items: [
      { name: "Overlay", price: "£28", note: "1 hr · no extensions" },
      { name: "Full set · mini–medium", price: "£30", note: "1 hr" },
      { name: "Full set · long–XL", price: "£35", note: "1 hr 30" },
      { name: "Full set · XXL+", price: "£40", note: "2 hrs · DM first" },
      { name: "Infill", price: "£27", note: "1 hr" },
    ],
  },
  {
    title: "Gel-X",
    blurb: "Long without the weight. Infill every 2 weeks.",
    items: [
      { name: "Mini–medium", price: "£32", note: "1 hr" },
      { name: "Long–XL", price: "£35", note: "1 hr" },
      { name: "XXL+", price: "£40", note: "1 hr · DM first" },
      { name: "BIAB base under Gel-X", price: "+£10" },
    ],
  },
  {
    title: "BIAB",
    blurb: "Strengthen your own nails. Infill every 2.5–3.5 weeks.",
    items: [
      { name: "Overlay", price: "£30", note: "1 hr" },
      { name: "Infill", price: "£27", note: "1 hr" },
      { name: "Extensions · mini–medium", price: "£35", note: "1 hr 20 · no longer than medium" },
    ],
  },
  {
    title: "Gel",
    items: [
      { name: "Gel manicure", price: "£30", note: "Needs a design on top" },
      { name: "Gel redo", price: "£32" },
    ],
  },
  {
    title: "Designs",
    items: [
      { name: "French, solid or ombré", price: "+£10" },
      { name: "A little art", price: "+£15", note: "up to 30 min" },
      { name: "Intricate", price: "+£20", note: "up to 45 min" },
      { name: "Advanced", price: "+£25", note: "up to 50 min" },
      { name: "Masterpiece", price: "+£30", note: "60 min+" },
      { name: "Jibby’s choice", price: "+£33", note: "add-ons included" },
      { name: "Mood-board freestyle", price: "+£35", note: "add-ons included" },
    ],
  },
  {
    title: "Recreate",
    items: [
      { name: "Overlay / mini", price: "from £50" },
      { name: "Short–medium", price: "from £50" },
      { name: "Long–XL", price: "from £55" },
    ],
  },
  {
    title: "Soak off",
    items: [
      { name: "Soak off", price: "£10" },
      { name: "Soak off with a new set", price: "£7" },
      { name: "Foreign soak off", price: "£15" },
      { name: "Foreign soak off with a new set", price: "£12" },
    ],
  },
  {
    title: "Repairs & extras",
    items: [
      { name: "Replacement extension", price: "£1 each", note: "Max 5. More than 5 is a full set." },
      { name: "Chrome", price: "+£5" },
    ],
  },
];

