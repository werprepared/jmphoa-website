import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";
import { format, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hero, intro, events, sponsors] = await Promise.all([
    prisma.pageContent.findUnique({ where: { key: "home_hero" } }),
    prisma.pageContent.findUnique({ where: { key: "home_intro" } }),
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: startOfDay(new Date()) } },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <section className="relative bg-navy text-white">
        {hero?.imageUrl && (
          <div className="absolute inset-0">
            <Image src={hero.imageUrl} alt="" fill className="object-cover opacity-55" priority />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold">
            {hero?.title || "Welcome to John Mitchell Preserve"}
          </h1>
          {hero?.body ? (
            <div className="mt-4 max-w-2xl mx-auto text-white/90">
              <RichText html={hero.body} className="prose-content [&_*]:text-white/90" />
            </div>
          ) : (
            <p className="mt-4 max-w-2xl mx-auto text-white/90">
              A single source for community news, events, documents, and neighbor connections for the
              John Mitchell Preserve Homeowners Association.
            </p>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid gap-4 sm:grid-cols-4">
        {[
          { href: "/calendar", label: "Calendar", desc: "See upcoming events" },
          { href: "/members/documents", label: "HOA Documents", desc: "Bylaws, minutes & more" },
          { href: "/members/directory", label: "Member Directory", desc: "Connect with neighbors" },
          { href: "/contact", label: "Contact Us", desc: "Reach the Board or a committee" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-card border border-border rounded-lg p-5 hover:shadow-md hover:border-primary transition-all"
          >
            <h3 className="font-semibold text-navy">{item.label}</h3>
            <p className="text-sm text-muted mt-1">{item.desc}</p>
          </Link>
        ))}
      </section>

      {intro?.body && (
        <section className="max-w-6xl mx-auto px-4 pb-10 grid gap-8 sm:grid-cols-2 items-center">
          {intro.imageUrl && (
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image src={intro.imageUrl} alt="" fill className="object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-navy mb-3">{intro.title || "Sharing Our Community"}</h2>
            <RichText html={intro.body} />
          </div>
        </section>
      )}

      <section className="bg-primary-light">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-semibold text-navy mb-6">Upcoming Events</h2>
          {events.length === 0 ? (
            <p className="text-muted">No upcoming events yet. Check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => (
                <div key={e.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-primary font-semibold text-sm uppercase">
                    {format(e.startsAt, "MMM d")}
                  </div>
                  <div className="font-medium text-navy mt-1">{e.title}</div>
                  <div className="text-sm text-muted mt-1">
                    {e.allDay ? "All day" : format(e.startsAt, "h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/calendar" className="inline-block mt-6 text-primary font-medium hover:underline">
            View full calendar →
          </Link>
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold text-navy mb-6 text-center">Our Sponsors</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {sponsors.map((s) => (
              <a
                key={s.id}
                href={s.linkUrl || undefined}
                target={s.linkUrl ? "_blank" : undefined}
                rel="noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                {s.logoUrl ? (
                  <Image src={s.logoUrl} alt={s.name} width={140} height={70} className="object-contain h-16 w-auto" />
                ) : (
                  <span className="text-navy font-medium">{s.name}</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
