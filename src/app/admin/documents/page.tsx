import Link from "next/link";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { uploadableCategoriesForRole, DOC_CATEGORY_LABELS } from "@/lib/roles";
import { createFolderAction, deleteDocumentAction, deleteFolderAction } from "./actions";
import UploadDocumentForm from "./UploadDocumentForm";
import type { DocCategory } from "@prisma/client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; folder?: string }>;
}) {
  const user = await requireApprovedUser();
  const allowedCategories = uploadableCategoriesForRole(user.role);
  if (allowedCategories.length === 0) {
    return <p className="text-muted">You don&apos;t have document upload permissions.</p>;
  }

  const { category: categoryParam, folder: folderId } = await searchParams;
  const category = (allowedCategories.includes(categoryParam as DocCategory) ? categoryParam : allowedCategories[0]) as DocCategory;

  const [subfolders, documents] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId ?? null, category }, orderBy: { sortOrder: "asc" } }),
    prisma.document.findMany({
      where: { folderId: folderId ?? null, category },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-6">Documents</h1>

      {allowedCategories.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {allowedCategories.map((c) => (
            <Link
              key={c}
              href={`/admin/documents?category=${c}`}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                c === category ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"
              }`}
            >
              {DOC_CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>
      )}

      <form
        action={async (formData: FormData) => {
          "use server";
          formData.set("category", category);
          formData.set("parentId", folderId || "");
          await createFolderAction(formData);
        }}
        className="flex gap-2 mb-6"
      >
        <input name="name" placeholder="New folder name" className="flex-1 border border-border rounded px-3 py-2 text-sm" />
        <button className="bg-white border border-border hover:border-primary text-navy text-sm font-medium px-4 py-2 rounded transition-colors">
          Create folder
        </button>
      </form>

      {subfolders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          {subfolders.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg p-4">
              <Link href={`/admin/documents?category=${category}&folder=${f.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl" aria-hidden>📁</span>
                <span className="font-medium text-navy truncate">{f.name}</span>
              </Link>
              <form action={async () => { "use server"; await deleteFolderAction(f.id); }}>
                <button className="text-xs text-muted hover:text-red-600 shrink-0">Delete</button>
              </form>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden mb-8">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3 bg-card">
              <div>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-navy hover:underline">
                  {d.title}
                </a>
                <div className="text-xs text-muted">{format(d.createdAt, "MMM d, yyyy")}</div>
              </div>
              <form action={async () => { "use server"; await deleteDocumentAction(d.id); }}>
                <button className="text-xs text-muted hover:text-red-600">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <UploadDocumentForm category={category} folderId={folderId || null} />
    </div>
  );
}
