import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireApprovedUser();
  const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Control what neighbors see about you in the Member Directory." />
      <div className="max-w-xl mx-auto px-4 py-10">
        <ProfileForm profile={profile} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
