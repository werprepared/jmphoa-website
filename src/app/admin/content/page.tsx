import Link from "next/link";
import { requireRole } from "@/lib/authz";

export default async function ContentAdminIndex() {
  await requireRole("ADMIN");

  const items = [
    { href: "/admin/content/home", label: "Home Page", desc: "Hero banner text/photo and welcome section" },
    { href: "/admin/content/about", label: "About Page", desc: "Intro text on the About overview page" },
    { href: "/admin/content/board", label: "Board Members", desc: "Positions and who holds them" },
    { href: "/admin/content/faq", label: "FAQ", desc: "Frequently asked questions" },
    { href: "/admin/content/sponsors", label: "Sponsors", desc: "Sponsor logos and links" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-6">Site Content</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all">
            <h3 className="font-semibold text-navy">{i.label}</h3>
            <p className="text-sm text-muted mt-1">{i.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
