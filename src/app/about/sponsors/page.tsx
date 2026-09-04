import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <PageHeader title="Our Sponsors" subtitle="Local businesses that support the John Mitchell Preserve community." />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {sponsors.length === 0 ? (
          <p className="text-muted">No sponsors listed yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {sponsors.map((s) => (
              <a
                key={s.id}
                href={s.linkUrl || undefined}
                target={s.linkUrl ? "_blank" : undefined}
                rel="noreferrer"
                className="bg-card border border-border rounded-lg p-5 flex gap-4 items-center hover:shadow-md transition-shadow"
              >
                {s.logoUrl && (
                  <Image src={s.logoUrl} alt={s.name} width={80} height={80} className="object-contain h-16 w-16 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-navy">{s.name}</div>
                  {s.blurb && <div className="text-sm text-muted mt-1">{s.blurb}</div>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
