import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/authz";
import { canEditDues, getDuesSettings } from "@/lib/dues";
import DuesSettingsForm from "./DuesSettingsForm";

export const dynamic = "force-dynamic";

export default async function EditDuesSettings() {
  const user = await requireApprovedUser();
  if (!(await canEditDues(user))) redirect("/members");
  const settings = await getDuesSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Dues Settings</h1>
        <p className="text-muted text-sm mt-1">
          The dues year, amount, due date and late fee shown on the Pay Association Fees page. After the due date,
          the online payment form fills in the dues plus the late fee. Homeowners can still change the amount
          they pay. Only the Treasurer and Admins can change these settings.
        </p>
      </div>
      <DuesSettingsForm settings={settings} />
    </div>
  );
}
