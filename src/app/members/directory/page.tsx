import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { lastFirst, lastNameSortKey } from "@/lib/format";
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
  });

  const entries = users
    .map((u) => ({
      id: u.id,
      name: lastFirst(u.name),
      address: u.profile?.address || null,
      sortKey: lastNameSortKey(u.name),
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div>
      <PageHeader title="Member Directory" subtitle="Only members who choose to share their information appear here." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <DirectoryList entries={entries} />
      </div>
    </div>
  );
}
