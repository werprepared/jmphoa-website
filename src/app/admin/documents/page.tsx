import Link from "next/link";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { uploadableCategoriesForRole, DOC_CATEGORY_LABELS } from "@/lib/roles";
import { createFolderAction } from "./actions";
import FolderRow from "./FolderRow";
import DocumentRow from "./DocumentRow";
import UploadDocumentForm from "./UploadDocumentForm";
import type { DocCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; folder?: string }>;
}) {
  const user = await requireApprovedUser();
  const allowedCategories = uploadableCategoriesForRole(user.roles);
  if (allowedCategories.length === 0) {
    return <p className="text-muted">You don&apos;t have document upload permissions.</p>;
  }

  const { category: categoryParam, folder: folderId } = await searchParams;
  const category = (allowedCategories.includes(categoryParam as DocCategory) ? categoryParam : allowedCategories[0]) as DocCategory;

  const [subfolders, documents, currentFolder, members] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId ?? null, category }, orderBy: { name: "asc" } }),
    prisma.document.findMany({
      where: { folderId: folderId ?? null, category },
      orderBy: { title: "asc" },
    }),
    folderId ? prisma.folder.findUnique({ where: { id: folderId } }) : null,
    prisma.user.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const uploadTargetName = currentFolder?.name ?? DOC_CATEGORY_LABELS[category];

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
            <FolderRow key={f.id} id={f.id} name={f.name} href={`/admin/documents?category=${category}&folder=${f.id}`} />
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden mb-8">
          {documents.map((d) => (
            <DocumentRow key={d.id} id={d.id} title={d.title} fileUrl={d.fileUrl} createdAt={d.createdAt} />
          ))}
        </ul>
      )}

      <UploadDocumentForm category={category} folderId={folderId || null} targetName={uploadTargetName} members={members} />
    </div>
  );
}
