import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addBoardPositionAction, deleteBoardPositionAction } from "../actions";
import BoardAssignSelect from "./BoardAssignSelect";

export const dynamic = "force-dynamic";

export default async function BoardAdminPage() {
  await requireRole("ADMIN");
  const [positions, users] = await Promise.all([
    prisma.boardPosition.findMany({ orderBy: { sortOrder: "asc" }, include: { user: true } }),
    prisma.user.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Board Members</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          const title = String(formData.get("title") || "").trim();
          if (title) await addBoardPositionAction(title);
        }}
        className="bg-card border border-border rounded-lg p-5 flex gap-3"
      >
        <input name="title" placeholder="e.g. President" required className="flex-1 border border-border rounded px-3 py-2" />
        <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          Add position
        </button>
      </form>

      <div className="space-y-2">
        {positions.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="font-medium text-navy">{p.title}</span>
            <div className="flex items-center gap-3">
              <BoardAssignSelect positionId={p.id} currentUserId={p.userId} users={users} />
              <form action={async () => { "use server"; await deleteBoardPositionAction(p.id); }}>
                <button className="text-xs text-muted hover:text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
