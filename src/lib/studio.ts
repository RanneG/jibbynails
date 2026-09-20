export const studio = {
  name: "Jibbynails",
  handle: "@jibbynails",
  email: "Jibscabling@gmail.com",
  location: "Strood, Medway ME2",
  area: "Medway",
  tagline: "3D, kawaii and character sets — booked without the guesswork.",
  instagram: "https://www.instagram.com/jibbynails/",
  facebook: "https://www.facebook.com/jibbynails",
  tiktok: "https://www.tiktok.com/@jibbynails",
  bookApp: "https://jibbynails.book.app/book-now",
  openDays: [0, 1, 2, 4] as number[], // Sun, Mon, Tue, Thu
  openHour: 9,
  closeHour: 19,
  hoursLabel: [
    { day: "Sunday", hours: "9:00 – 19:00" },
    { day: "Monday", hours: "9:00 – 19:00" },
    { day: "Tuesday", hours: "9:00 – 19:00" },
    { day: "Wednesday", hours: "Closed" },
    { day: "Thursday", hours: "9:00 – 19:00" },
    { day: "Friday", hours: "Closed" },
    { day: "Saturday", hours: "Closed" },
  ],
  gallery: [
    {
      src: "/brand/gallery-1.jpg",
      alt: "Nude almond nails with candy-stripe French tips and tiny charms",
    },
    {
      src: "/brand/gallery-2.jpg",
      alt: "Playful mixed character set with charms and colour",
    },
    {
      src: "/brand/gallery-3.jpg",
      alt: "Yellow and berry fruit-inspired set with 3D texture",
    },
    {
      src: "/brand/gallery-4.jpg",
      alt: "Detailed Jibbynails set",
    },
    {
      src: "/brand/gallery-5.jpg",
      alt: "Detailed Jibbynails set",
    },
  ],
} as const;
