import "server-only";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateOnly, localDateKey } from "@/lib/format";

/** Dues settings live in PageContent (body = JSON) so no schema change is needed. */
const SETTINGS_KEY = "dues_settings";

export const duesSettingsSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  amountCents: z.number().int().min(100).max(10_000_00),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid due date."),
  lateFeeCents: z.number().int().min(0).max(10_000_00),
  /** Wording shown on the dues page; when empty, it's generated from the fields above. */
  notice: z.string().trim().max(600).optional(),
});

export type DuesSettings = z.infer<typeof duesSettingsSchema>;

/** Smallest and largest amount a payer may enter online, in cents. */
export const MIN_PAYMENT_CENTS = 100;
export const MAX_PAYMENT_CENTS = 5_000_00;

function defaultSettings(): DuesSettings {
  const year = new Date().getFullYear();
  return { year, amountCents: 20000, dueDate: `${year}-05-31`, lateFeeCents: 1500 };
}

export async function getDuesSettings(): Promise<DuesSettings> {
  const row = await prisma.pageContent.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row?.body) return defaultSettings();
  try {
    const parsed = duesSettingsSchema.safeParse(JSON.parse(row.body));
    return parsed.success ? parsed.data : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export async function saveDuesSettings(settings: DuesSettings) {
  const body = JSON.stringify(settings);
  await prisma.pageContent.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, title: "Dues settings", body },
    update: { body },
  });
}

/** True once the HOA's local date is after the due date. */
export function isPastDue(settings: DuesSettings, now = new Date()) {
  return localDateKey(now) > settings.dueDate;
}

/** What a home owes if paying today: dues, plus the late fee after the due date. */
export function amountDueNowCents(settings: DuesSettings, now = new Date()) {
  return settings.amountCents + (isPastDue(settings, now) ? settings.lateFeeCents : 0);
}

export function formatDueDate(dueDate: string, pattern = "MMMM d, yyyy") {
  return formatDateOnly(new Date(`${dueDate}T00:00:00Z`), pattern);
}

/** The saved wording if there is one, otherwise the generated sentence. */
export function duesNotice(settings: DuesSettings) {
  return settings.notice || suggestedDuesNotice(settings);
}

/** e.g. "Dues for 2026 are $200 if paid by May 31, 2026. A late fee of $15 is added for payments received after May 31." */
export function suggestedDuesNotice(settings: DuesSettings) {
  const base = `Dues for ${settings.year} are ${dollars(settings.amountCents)} if paid by ${formatDueDate(settings.dueDate)}.`;
  if (!settings.lateFeeCents) return base;
  return `${base} A late fee of ${dollars(settings.lateFeeCents)} is added for payments received after ${formatDueDate(settings.dueDate, "MMMM d")}.`;
}

/** Whole-dollar amounts print without cents ($200), others with ($212.50). */
export function dollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/** Whether the user holds the board's Treasurer position. */
export async function isTreasurer(userId: string | undefined) {
  if (!userId) return false;
  const position = await prisma.boardPosition.findUnique({ where: { userId }, select: { title: true } });
  return !!position && position.title.trim().toLowerCase() === "treasurer";
}

/** Admins and the Treasurer may change dues settings. */
export async function canEditDues(user: { id?: string; roles?: Role[] } | null) {
  if (!user) return false;
  if (user.roles?.includes("ADMIN")) return true;
  return isTreasurer(user.id);
}

/** Admins, board members and the Treasurer may see online payments. */
export async function canSeeDuesPayments(user: { id?: string; roles?: Role[] } | null) {
  if (!user) return false;
  if (user.roles?.some((r) => r === "ADMIN" || r === "BOARD_MEMBER")) return true;
  return isTreasurer(user.id);
}
