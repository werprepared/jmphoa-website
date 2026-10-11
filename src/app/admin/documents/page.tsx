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

  const [subfolders, documents, categoryFolders, members] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId ?? null, category }, orderBy: { name: "asc" } }),
    prisma.document.findMany({
      where: { folderId: folderId ?? null, category },
      orderBy: { title: "asc" },
    }),
    prisma.folder.findMany({
      where: { category, linkUrl: null },
      select: { id: true, name: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Every real folder on this tab, shown as a path ("5. Architecture Committee / Minutes").
  const byId = new Map(categoryFolders.map((f) => [f.id, f]));
  const pathOf = (id: string) => {
    const names: string[] = [];
    for (let f = byId.get(id); f; f = f.parentId ? byId.get(f.parentId) : undefined) names.unshift(f.name);
    return names.join(" / ");
  };
  const folderOptions = categoryFolders
    .map((f) => ({ id: f.id, label: pathOf(f.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  // Members see one folder tree, so a file with no folder lands at the top of HOA Documents.
  // On a committee/board tab, default to that tab's own top folder instead.
  const firstTopFolder = categoryFolders.find((f) => !f.parentId || !byId.has(f.parentId));
  const defaultFolderId =
    folderId && byId.has(folderId) ? folderId : category !== "HOA_GENERAL" ? (firstTopFolder?.id ?? "") : "";

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
            <FolderRow
              key={f.id}
              id={f.id}
              name={f.name}
              href={`/admin/documents?category=${category}&folder=${f.id}`}
              linkUrl={f.linkUrl}
            />
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

      <UploadDocumentForm
        key={`${category}-${defaultFolderId}`}
        category={category}
        folders={folderOptions}
        defaultFolderId={defaultFolderId}
        members={members}
      />
    </div>
  );
}
