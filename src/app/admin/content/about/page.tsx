import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import PageContentEditor from "../PageContentEditor";

export const dynamic = "force-dynamic";

export default async function EditAboutContent() {
  await requireRole("ADMIN");
  const intro = await prisma.pageContent.findUnique({ where: { key: "about_intro" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">About Page Content</h1>
      <PageContentEditor contentKey="about_intro" label="About Overview" block={intro} imageLabel="Photo" />
    </div>
  );
}
