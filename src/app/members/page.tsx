import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { roleLabels } from "@/lib/roles";

const LINKS = [
  { href: "/members/directory", label: "Member Directory", desc: "Look up and connect with neighbors" },
  { href: "/members/community", label: "Community Wall", desc: "Share updates and news with the neighborhood" },
  { href: "/members/board", label: "Board Members", desc: "Who serves on the HOA Board" },
  { href: "/members/committees", label: "Committee Members", desc: "View rosters and request to join Architecture, Social, or Landscape" },
  { href: "/members/faq", label: "FAQ", desc: "Common questions about the HOA" },
  { href: "/members/documents", label: "HOA Documents", desc: "Bylaws, minutes, forms & more" },
  { href: "/members/survey", label: "Survey / Feedback", desc: "Tell us what you think" },
  { href: "/members/dues", label: "Pay Association Fees", desc: "Venmo or mail-in instructions" },
  { href: "/members/profile", label: "My Profile", desc: "Update your directory listing" },
];

export default async function MembersHome() {
  const user = await requireApprovedUser();

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.name?.split(" ")[0] || "neighbor"}`} subtitle={roleLabels(user.roles)} />
      <div className="max-w-5xl mx-auto px-4 py-10 grid gap-4 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all">
            <h3 className="font-semibold text-navy">{l.label}</h3>
            <p className="text-sm text-muted mt-1">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
