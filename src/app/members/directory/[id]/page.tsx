import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-navy">{value}</div>
    </div>
  );
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: { include: { spouse: true } } },
  });

  if (!user || user.status !== "APPROVED" || !user.profile?.showInDirectory) {
    notFound();
  }

  const profile = user.profile;
  const spouseDisplayName = profile.spouse?.name ?? profile.spouseName;

  return (
    <div>
      <PageHeader title={user.name} subtitle="Member Directory" />
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {profile.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border border-border"
            />
          )}

          <Field label="Address" value={profile.address} />
          <Field label="Phone" value={formatPhone(profile.phone)} />
          <Field label="Email" value={profile.publicEmail} />

          {spouseDisplayName && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Spouse</div>
              {profile.spouse ? (
                <Link href={`/members/directory/${profile.spouse.id}`} className="text-primary hover:underline">
                  {spouseDisplayName}
                </Link>
              ) : (
                <div className="text-navy">{spouseDisplayName}</div>
              )}
            </div>
          )}

          <Field label="Children" value={profile.children} />
          <Field label="Pets" value={profile.pets} />
          <Field label="Interests" value={profile.interests} />
          <Field label="Work" value={profile.workInfo} />

          {!profile.address &&
            !profile.phone &&
            !profile.publicEmail &&
            !spouseDisplayName &&
            !profile.children &&
            !profile.pets &&
            !profile.interests &&
            !profile.workInfo && <p className="text-muted text-sm">This member hasn&apos;t shared any details yet.</p>}
        </div>

        <Link href="/members/directory" className="inline-block mt-6 text-sm text-primary hover:underline">
          ← Back to Directory
        </Link>
      </div>
    </div>
  );
}
