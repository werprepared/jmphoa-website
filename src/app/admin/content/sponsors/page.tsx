import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addSponsorAction, deleteSponsorAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SponsorsAdminPage() {
  await requireRole("ADMIN");
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Sponsors</h1>

      <form action={addSponsorAction} className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-navy text-sm">Add a sponsor</h2>
        <input name="name" placeholder="Business name" required className="w-full border border-border rounded px-3 py-2" />
        <input name="linkUrl" placeholder="Website URL (optional)" className="w-full border border-border rounded px-3 py-2" />
        <textarea name="blurb" placeholder="Short description (optional)" rows={2} className="w-full border border-border rounded px-3 py-2" />
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <input type="file" name="logo" accept="image/*" className="text-sm" />
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          Add sponsor
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {sponsors.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {s.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="h-10 w-10 object-contain" />
              )}
              <span className="font-medium text-navy">{s.name}</span>
            </div>
            <form action={async () => { "use server"; await deleteSponsorAction(s.id); }}>
              <button className="text-xs text-muted hover:text-red-600 shrink-0">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
