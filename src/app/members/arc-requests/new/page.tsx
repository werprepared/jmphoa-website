import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import NewArcRequestForm from "./NewArcRequestForm";

export const dynamic = "force-dynamic";

export default async function NewArcRequestPage() {
  const user = await requireApprovedUser();
  const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader title="New ARC Request" subtitle="Request for Architectural Approval" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <NewArcRequestForm
          defaultName={user.name ?? ""}
          defaultAddress={profile?.address ?? ""}
          defaultPhone={profile?.phone ?? ""}
          defaultEmail={profile?.publicEmail || user.email || ""}
        />
      </div>
    </div>
  );
}
