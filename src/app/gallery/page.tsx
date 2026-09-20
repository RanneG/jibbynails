import Image from "next/image";
import { BottomNav } from "@/components/bottom-nav";
import { studio } from "@/lib/studio";

export const metadata = {
  title: "Sets — Jibbynails",
};

export default function GalleryPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-8 pt-6">
        <p className="eyebrow">Recent work</p>
        <h1 className="font-heading mt-1.5 text-[2.15rem] leading-none tracking-tight">Sets</h1>
        <div className="mt-5 columns-2 gap-2">
          {studio.gallery.map((shot) => (
            <div key={shot.src} className="mb-2 break-inside-avoid overflow-hidden rounded-2xl">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={400}
                height={520}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
        <a href={studio.instagram} className="mt-6 block text-center text-sm text-gold">
          {studio.handle}
        </a>
      </main>
      <BottomNav />
    </div>
  );
}
