import type { Metadata, Viewport } from "next";
import { Great_Vibes, Outfit } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Jibbynails — Book a set",
    template: "%s",
  },
  description:
    "Book Jibbynails in Strood. £15 deposit an hour, her real menu, and reviews on the site.",
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f6efe6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${script.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
