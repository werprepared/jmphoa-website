import Link from "next/link";
import { requireApprovedUser } from "@/lib/authz";
import { canManageMembers, canEditSiteContent, canManageCalendar, isAdmin } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApprovedUser();

  const links = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/users", label: "Members & Roles", show: canManageMembers(user.roles) },
    { href: "/admin/content", label: "Site Content", show: canEditSiteContent(user.roles) },
    { href: "/admin/documents", label: "Documents", show: canManageCalendar(user.roles) },
    { href: "/admin/calendar", label: "Calendar", show: canManageCalendar(user.roles) },
    { href: "/admin/committees", label: "Committees", show: isAdmin(user.roles) },
    { href: "/admin/usage", label: "System Usage", show: isAdmin(user.roles) },
  ].filter((l) => l.show);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full flex flex-col sm:flex-row gap-8">
      <aside className="sm:w-56 shrink-0">
        <h2 className="text-xs font-semibold uppercase text-muted tracking-wide mb-3">Admin Tools</h2>
        <nav className="flex sm:flex-col gap-1 flex-wrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded text-sm font-medium text-navy hover:bg-primary-light"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
