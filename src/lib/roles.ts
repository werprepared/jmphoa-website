import type { Role, DocCategory, Committee } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MEMBERSHIP_COORDINATOR: "Membership Coordinator",
  BOARD_MEMBER: "Board Member",
  COMMITTEE_ARCH: "Architecture Committee",
  COMMITTEE_SOCIAL: "Social Committee",
  MEMBER: "Member",
};

export const ALL_ROLES: Role[] = [
  "ADMIN",
  "MEMBERSHIP_COORDINATOR",
  "BOARD_MEMBER",
  "COMMITTEE_ARCH",
  "COMMITTEE_SOCIAL",
  "MEMBER",
];

/** Human-readable label for a user's full set of roles, e.g. "Board Member, Membership Coordinator". */
export function roleLabels(roles?: Role[] | null): string {
  if (!roles || roles.length === 0) return ROLE_LABELS.MEMBER;
  return roles.map((r) => ROLE_LABELS[r]).join(", ");
}

export function isAdmin(roles?: Role[] | null) {
  return !!roles?.includes("ADMIN");
}

export function canManageMembers(roles?: Role[] | null) {
  return !!roles && (roles.includes("ADMIN") || roles.includes("MEMBERSHIP_COORDINATOR"));
}

export function canEditSiteContent(roles?: Role[] | null) {
  return !!roles?.includes("ADMIN");
}

export function canManageCalendar(roles?: Role[] | null) {
  return (
    !!roles &&
    roles.some((r) => r === "ADMIN" || r === "BOARD_MEMBER" || r === "COMMITTEE_ARCH" || r === "COMMITTEE_SOCIAL")
  );
}

/** Which document categories the union of a user's roles is allowed to upload/manage documents into. */
export function uploadableCategoriesForRole(roles?: Role[] | null): DocCategory[] {
  if (!roles) return [];
  if (roles.includes("ADMIN")) return ["HOA_GENERAL", "BOARD", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL"];

  const categories = new Set<DocCategory>();
  if (roles.includes("BOARD_MEMBER")) categories.add("BOARD");
  if (roles.includes("COMMITTEE_ARCH")) categories.add("COMMITTEE_ARCH");
  if (roles.includes("COMMITTEE_SOCIAL")) categories.add("COMMITTEE_SOCIAL");
  return [...categories];
}

/** Which committees a user's roles give them standing in (a user can hold both). */
export function committeesForRoles(roles?: Role[] | null): Committee[] {
  const committees: Committee[] = [];
  if (roles?.includes("COMMITTEE_ARCH")) committees.push("ARCHITECTURE");
  if (roles?.includes("COMMITTEE_SOCIAL")) committees.push("SOCIAL");
  return committees;
}

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  HOA_GENERAL: "HOA Documents",
  BOARD: "Board Documents",
  COMMITTEE_ARCH: "Architecture Committee",
  COMMITTEE_SOCIAL: "Social Committee",
};
