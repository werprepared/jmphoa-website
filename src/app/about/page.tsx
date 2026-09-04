import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await prisma.pageContent.findUnique({ where: { key: "about_intro" } });

  return (
    <div>
      <PageHeader title="About John Mitchell Preserve" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {content?.body ? (
          <RichText html={content.body} />
        ) : (
          <p className="text-muted">
            John Mitchell Preserve is a friendly, well-kept community. Learn more about our Board,
            committees, and community below.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {[
            { href: "/about/board", label: "Board Members", desc: "Who serves on the HOA Board" },
            { href: "/about/committees", label: "Committee Members", desc: "Architecture & Social committees" },
            { href: "/about/faq", label: "FAQ", desc: "Common questions about the HOA" },
            { href: "/about/sponsors", label: "Sponsors", desc: "Businesses that support our community" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all">
              <h3 className="font-semibold text-navy">{l.label}</h3>
              <p className="text-sm text-muted mt-1">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
