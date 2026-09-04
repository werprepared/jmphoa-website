import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import DirectoryList from "./DirectoryList";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  await requireApprovedUser();

  const users = await prisma.user.findMany({
    where: {
      status: "APPROVED",
      profile: { showInDirectory: true },
    },
    include: { profile: true },
    orderBy: { name: "asc" },
  });

  const entries = users.map((u) => ({
    id: u.id,
    name: u.name,
    address: u.profile?.address || null,
    phone: u.profile?.phone || null,
    email: u.profile?.publicEmail || null,
    children: u.profile?.children || null,
    pets: u.profile?.pets || null,
    interests: u.profile?.interests || null,
    workInfo: u.profile?.workInfo || null,
  }));

  return (
    <div>
      <PageHeader title="Member Directory" subtitle="Only members who choose to share their information appear here." />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <DirectoryList entries={entries} />
      </div>
    </div>
  );
}
