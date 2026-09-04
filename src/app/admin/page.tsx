import Link from "next/link";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { canManageMembers, canEditSiteContent, canManageCalendar, isAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireApprovedUser();

  const [pendingUsers, pendingCommittees, upcomingEvents, documentCount] = await Promise.all([
    canManageMembers(user.role) ? prisma.user.count({ where: { status: "PENDING" } }) : 0,
    isAdmin(user.role) ? prisma.committeeMembership.count({ where: { approved: false } }) : 0,
    prisma.calendarEvent.count({ where: { startsAt: { gte: new Date() } } }),
    prisma.document.count(),
  ]);

  const cards = [
    canManageMembers(user.role) && {
      href: "/admin/users",
      label: "Pending member approvals",
      value: pendingUsers,
    },
    isAdmin(user.role) && {
      href: "/admin/committees",
      label: "Pending committee requests",
      value: pendingCommittees,
    },
    canManageCalendar(user.role) && { href: "/admin/calendar", label: "Upcoming events", value: upcomingEvents },
    canManageCalendar(user.role) && { href: "/admin/documents", label: "Documents on file", value: documentCount },
  ].filter(Boolean) as { href: string; label: string; value: number }[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">Admin Dashboard</h1>
      <p className="text-muted mb-6">Welcome, {user.name}.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all">
            <div className="text-3xl font-semibold text-navy">{c.value}</div>
            <div className="text-sm text-muted mt-1">{c.label}</div>
          </Link>
        ))}
      </div>
      {canEditSiteContent(user.role) && (
        <div className="mt-8">
          <Link href="/admin/content" className="text-primary font-medium hover:underline">
            Edit Home, About, FAQ & Sponsors content →
          </Link>
        </div>
      )}
    </div>
  );
}
