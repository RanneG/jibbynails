import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { HomeReviews } from "@/components/home-reviews";
import { HoursCard } from "@/components/hours-card";
import { SocialLinks } from "@/components/social-links";
import { featured } from "@/lib/menu";
import { studio } from "@/lib/studio";

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1 px-5 pb-4 pt-8 md:px-8 md:pb-16 md:pt-6 lg:px-10 lg:pb-20">
        <div className="flex items-center justify-between md:hidden">
          <Image
            src="/brand/logo.png"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full border border-ink/15"
          />
          <a href={studio.instagram} target="_blank" rel="noopener noreferrer" className="pill">
            {studio.handle}
          </a>
        </div>

        <section className="md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-4 lg:gap-14 lg:pt-6">
          <div className="text-center md:text-left">
            <p className="eyebrow mt-8 md:mt-0">Strood · ME2</p>
            <h1 className="font-heading mt-2 text-[3.4rem] leading-none md:text-[5rem] lg:text-[6rem]">
              Jibbynails
            </h1>
            <p className="mx-auto mt-3 max-w-[16rem] text-center text-sm tracking-wide text-muted-foreground md:mx-0 md:max-w-md md:text-left md:text-base">
              kawaii, 3d and character sets. £15 deposit an hour.
            </p>
            <div className="mt-8 hidden gap-3 md:flex md:max-w-md">
              <Link href="/book" className="btn-gold flex-1">
                Book
              </Link>
              <Link
                href="/menu"
                className="press flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] border-ink lg:h-14 lg:text-[1.05rem]"
              >
                Menu
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-8 h-56 max-w-[20rem] md:hidden">
            <div className="absolute left-0 top-0 h-36 w-36 overflow-hidden rounded-2xl border border-ink/10">
              <Image src="/brand/gallery-1.jpg" alt="" fill className="object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 h-36 w-36 overflow-hidden rounded-2xl border border-ink/10">
              <Image src="/brand/gallery-2.jpg" alt="" fill className="object-cover" />
            </div>
          </div>

          <div className="mt-8 hidden grid-cols-2 gap-3 md:mt-0 md:grid lg:gap-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-ink/10">
              <Image src="/brand/gallery-1.jpg" alt="" fill className="object-cover" />
            </div>
            <div className="grid gap-3 lg:gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink/10">
                <Image src="/brand/gallery-2.jpg" alt="" fill className="object-cover" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink/10">
                <Image src="/brand/gallery-3.jpg" alt="" fill className="object-cover" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2 md:hidden">
            <Link href="/book" className="btn-gold flex-1">
              Book
            </Link>
            <Link
              href="/menu"
              className="press flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] border-ink"
            >
              Menu
            </Link>
          </div>
        </section>

        <div className="mt-8 space-y-10 md:mt-12 md:space-y-8 lg:mt-14">
          <HoursCard />

          <div className="space-y-10 md:grid md:grid-cols-2 md:items-stretch md:gap-6 md:space-y-0 lg:gap-8">
            <section>
              <div className="text-center md:text-left">
                <h2 className="font-heading text-[2.6rem] leading-none lg:text-[3.1rem]">Price List</h2>
                <span className="pill mt-3">From £15 / hour</span>
              </div>
              <ul className="surface mt-5 divide-y divide-ink/8 overflow-hidden rounded-3xl">
                {featured.map((item) => (
                  <li key={item.name}>
                    <Link href="/menu" className="press flex items-baseline justify-between gap-4 px-5 py-3.5 lg:px-6 lg:py-4">
                      <span className="text-sm tracking-wide lg:text-[15px]">{item.name}</span>
                      <span className="shrink-0 text-sm lg:text-[15px]">{item.price}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/menu"
                className="mt-3 block text-center text-sm underline decoration-ink/30 underline-offset-4 md:text-left"
              >
                Full list
              </Link>
            </section>

            <section className="flex flex-col justify-center rounded-[2rem] bg-sky px-5 py-8 text-center md:px-7 md:py-10">
              <h2 className="font-heading text-[2.6rem] leading-none lg:text-[3.1rem]">Policy</h2>
              <span className="pill mt-3">Read before booking</span>
              <p className="mt-4 text-sm leading-6 tracking-wide lg:text-[15px] lg:leading-7">
                £15 deposit to hold your slot. Balance in cash on the day. Home-based, two cats, street parking.
              </p>
              <Link href="/policy" className="mt-4 inline-block text-sm underline underline-offset-4">
                Full policy
              </Link>
            </section>
          </div>
        </div>

        <section className="pt-10 md:pt-14">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-[2.4rem] leading-none lg:text-[3rem]">Sets</h2>
            <Link href="/gallery" className="text-sm underline decoration-ink/30 underline-offset-4">
              All
            </Link>
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible">
            {studio.gallery.map((shot) => (
              <Link
                key={shot.src}
                href="/gallery"
                className="press relative h-40 w-32 shrink-0 snap-start overflow-hidden rounded-2xl md:aspect-[4/5] md:h-auto md:w-auto md:rounded-3xl"
              >
                <Image src={shot.src} alt={shot.alt} fill className="object-cover" />
              </Link>
            ))}
          </div>
        </section>

        <HomeReviews />
        <SocialLinks className="pb-4 md:hidden" />
      </main>
      <BottomNav />
    </div>
  );
}
