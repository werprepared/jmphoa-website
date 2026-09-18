import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function getBreadcrumb(folderId: string | null) {
  const crumbs: { id: string; name: string }[] = [];
  let current = folderId;
  while (current) {
    const folder = await prisma.folder.findUnique({ where: { id: current } });
    if (!folder) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    current = folder.parentId;
  }
  return crumbs;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  await requireApprovedUser();
  const { folder: folderId } = await searchParams;

  if (folderId) {
    const current = await prisma.folder.findUnique({ where: { id: folderId } });
    if (current?.linkUrl) redirect(current.linkUrl);
  }

  const [subfolders, documents, crumbs] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId ?? null },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { folderId: folderId ?? null },
      orderBy: { title: "asc" },
      include: { uploadedBy: true },
    }),
    getBreadcrumb(folderId ?? null),
  ]);

  return (
    <div>
      <PageHeader title="HOA Documents" subtitle="Bylaws, covenants, meeting minutes, and other community documents." />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-sm text-muted mb-6 flex flex-wrap gap-1">
          <Link href="/members/documents" className="hover:text-primary hover:underline">
            HOA Documents
          </Link>
          {crumbs.map((c) => (
            <span key={c.id} className="flex gap-1">
              <span>/</span>
              <Link href={`/members/documents?folder=${c.id}`} className="hover:text-primary hover:underline">
                {c.name}
              </Link>
            </span>
          ))}
        </div>

        {subfolders.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {subfolders.map((f) => (
              <Link
                key={f.id}
                href={f.linkUrl ?? `/members/documents?folder=${f.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <span className="text-2xl" aria-hidden>📁</span>
                <span className="font-medium text-navy">{f.name}</span>
              </Link>
            ))}
          </div>
        )}

        {documents.length === 0 ? (
          subfolders.length === 0 && <p className="text-muted">No documents here yet.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 bg-card">
                <div>
                  <div className="font-medium text-navy">{d.title}</div>
                  <div className="text-xs text-muted">
                    Uploaded by {d.uploadedBy.name} on {format(d.createdAt, "MMM d, yyyy")}
                  </div>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm font-medium hover:underline shrink-0 ml-4"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
