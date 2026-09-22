import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await prisma.pageContent.findUnique({ where: { key: "about_intro" } });

  return (
    <div>
      <PageHeader title="About John Mitchell Preserve" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {content?.body ? (
          content.imageUrl ? (
            <div className="grid gap-8 sm:grid-cols-2 items-center mb-8">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image src={content.imageUrl} alt="" fill className="object-cover" />
              </div>
              <RichText html={content.body} />
            </div>
          ) : (
            <RichText html={content.body} />
          )
        ) : (
          <p className="text-muted">
            John Mitchell Preserve is a friendly, well-kept community. Board Members, Committee Members
            (Architecture, Social, and Landscape), and FAQ information is available to logged-in members -{" "}
            <Link href="/login" className="text-primary hover:underline">sign in</Link> or{" "}
            <Link href="/register" className="text-primary hover:underline">register</Link> to view it.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {[
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
