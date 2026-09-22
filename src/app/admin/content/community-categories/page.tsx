import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addCommunityCategoryAction } from "../actions";
import CommunityCategoryRow from "./CommunityCategoryRow";

export const dynamic = "force-dynamic";

export default async function CommunityCategoriesAdminPage() {
  await requireRole("ADMIN");
  const categories = await prisma.communityCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-2">Community Categories</h1>
      <p className="text-sm text-muted mb-6">
        Members choose one of these categories when posting to the Community Wall, and can filter the wall by them.
      </p>

      <div className="space-y-2 mb-6">
        {categories.length === 0 ? (
          <p className="text-muted text-sm">No categories yet - add one below.</p>
        ) : (
          categories.map((c, i) => (
            <CommunityCategoryRow
              key={c.id}
              id={c.id}
              name={c.name}
              isFirst={i === 0}
              isLast={i === categories.length - 1}
            />
          ))
        )}
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await addCommunityCategoryAction(String(formData.get("name") || ""));
        }}
        className="flex gap-2"
      >
        <input name="name" placeholder="New category name" required className="flex-1 border border-border rounded px-3 py-2 text-sm" />
        <button className="bg-white border border-border hover:border-primary text-navy text-sm font-medium px-4 py-2 rounded transition-colors">
          Add category
        </button>
      </form>
    </div>
  );
}
