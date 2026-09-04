import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import PageContentEditor from "../PageContentEditor";

export const dynamic = "force-dynamic";

export default async function EditHomeContent() {
  await requireRole("ADMIN");
  const [hero, intro] = await Promise.all([
    prisma.pageContent.findUnique({ where: { key: "home_hero" } }),
    prisma.pageContent.findUnique({ where: { key: "home_intro" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Home Page Content</h1>
      <PageContentEditor contentKey="home_hero" label="Hero Banner" block={hero} imageLabel="Background photo" />
      <PageContentEditor contentKey="home_intro" label="Welcome Section" block={intro} imageLabel="Photo" />
    </div>
  );
}
