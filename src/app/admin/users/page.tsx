import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { roleLabels, isAdmin } from "@/lib/roles";
import { approveUserAction, rejectUserAction, removeUserAction } from "./actions";
import RoleSelect from "./RoleSelect";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requireRole("ADMIN", "MEMBERSHIP_COORDINATOR");

  const users = await prisma.user.findMany({
    include: { profile: true, roles: true },
    orderBy: { createdAt: "desc" },
  });

  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-6">Members & Roles</h1>

      <section className="mb-10">
        <h2 className="font-semibold text-navy mb-3">Pending Approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">No pending registration requests.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((u) => (
              <li key={u.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium text-navy">{u.name}</div>
                  <div className="text-sm text-muted">{u.email}</div>
                  {u.profile?.address && <div className="text-sm text-muted">{u.profile.address}</div>}
                  <div className="text-xs text-muted mt-1">Requested {format(u.createdAt, "MMM d, yyyy")}</div>
                </div>
                <div className="flex gap-2">
                  <form action={async () => { "use server"; await approveUserAction(u.id); }}>
                    <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-3 py-1.5 rounded transition-colors">
                      Approve
                    </button>
                  </form>
                  <form action={async () => { "use server"; await rejectUserAction(u.id); }}>
                    <button className="bg-white border border-border hover:border-red-400 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded transition-colors">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-navy mb-3">All Members ({others.length})</h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-primary-light text-navy text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {others.map((u) => (
                <tr key={u.id} className="border-t border-border bg-card">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2 text-muted">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={u.status === "APPROVED" ? "text-primary" : "text-muted"}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    {isAdmin(actor.roles) && u.id !== actor.id ? (
                      <RoleSelect userId={u.id} roles={u.roles.map((r) => r.role)} />
                    ) : (
                      roleLabels(u.roles.map((r) => r.role))
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.id !== actor.id && !isAdmin(u.roles.map((r) => r.role)) && (
                      <form action={async () => { "use server"; await removeUserAction(u.id); }}>
                        <button className="text-muted hover:text-red-600 text-xs">Remove</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
