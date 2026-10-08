"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/authz";
import { canEditDues, duesSettingsSchema, saveDuesSettings } from "@/lib/dues";

export type DuesSettingsState = { error?: string; success?: boolean } | undefined;

function toCents(value: FormDataEntryValue | null) {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Math.round(Number(cleaned) * 100) : NaN;
}

export async function saveDuesSettingsAction(_prev: DuesSettingsState, formData: FormData): Promise<DuesSettingsState> {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED" || !(await canEditDues(user))) {
    return { error: "Only the Treasurer or an Admin can change dues settings." };
  }

  const parsed = duesSettingsSchema.safeParse({
    year: Number(formData.get("year")),
    amountCents: toCents(formData.get("amount")),
    dueDate: String(formData.get("dueDate") ?? ""),
    lateFeeCents: toCents(formData.get("lateFee")),
    notice: String(formData.get("notice") ?? "") || undefined,
    // Normalize Windows line endings and drop trailing spaces on each line.
    mailAddress:
      String(formData.get("mailAddress") ?? "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n") || undefined,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const messages: Record<string, string> = {
      year: "Please enter a valid year.",
      amountCents: "Please enter the dues amount, like 200.00 (at least $1).",
      dueDate: "Please enter the due date.",
      lateFeeCents: "Please enter the late fee, like 15.00 (or 0 for none).",
      notice: "The dues page wording is too long (600 characters max).",
      mailAddress: "The mailing address is too long (300 characters max).",
    };
    return { error: messages[String(field)] ?? "Please check your entries." };
  }

  await saveDuesSettings(parsed.data);
  revalidatePath("/dues");
  revalidatePath("/admin/content/dues");
  return { success: true };
}
