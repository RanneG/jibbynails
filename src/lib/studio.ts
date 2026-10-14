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
  /**
   * Every photo is filed under the tier it would book as (`hours` matches
   * `consultLengths`). Move a photo by changing its `hours`.
   */
  gallery: [
    {
      src: "/brand/gallery-1.jpg",
      alt: "Short round nails with red candy-stripe French tips and tiny 3D flowers",
      caption: "Short round · candy-stripe French · tiny 3D flowers",
      hours: 1.5,
    },
    {
      src: "/brand/gallery-4.jpg",
      alt: "Square white French nails with silver butterflies, crosses and pearls",
      caption: "Square · white French · silver charms and pearls",
      hours: 2,
    },
    {
      src: "/brand/gallery-5.jpg",
      alt: "Almond nails with a painted character, blue 3D bows and cherries",
      caption: "Almond · painted character · blue 3D bows",
      hours: 2,
    },
    {
      src: "/brand/gallery-2.jpg",
      alt: "Long almond dessert set with 3D bows, whipped cream, cherries and chocolate texture",
      caption: "Long almond · 3D bows, cream and chocolate texture",
      hours: 3,
    },
    {
      src: "/brand/gallery-3.jpg",
      alt: "Airbrushed fruit set with painted citrus slices and 3D croissant texture",
      caption: "Almond · airbrushed fruit · hand-painted slices · 3D texture",
      hours: 3,
    },
  ],
} as const;
