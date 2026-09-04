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

export function isAdmin(role?: Role | null) {
  return role === "ADMIN";
}

export function canManageMembers(role?: Role | null) {
  return role === "ADMIN" || role === "MEMBERSHIP_COORDINATOR";
}

export function canEditSiteContent(role?: Role | null) {
  return role === "ADMIN";
}

export function canManageCalendar(role?: Role | null) {
  return (
    role === "ADMIN" || role === "BOARD_MEMBER" || role === "COMMITTEE_ARCH" || role === "COMMITTEE_SOCIAL"
  );
}

/** Which document category a role is allowed to upload/manage documents into. */
export function uploadableCategoriesForRole(role?: Role | null): DocCategory[] {
  switch (role) {
    case "ADMIN":
      return ["HOA_GENERAL", "BOARD", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL"];
    case "BOARD_MEMBER":
      return ["BOARD"];
    case "COMMITTEE_ARCH":
      return ["COMMITTEE_ARCH"];
    case "COMMITTEE_SOCIAL":
      return ["COMMITTEE_SOCIAL"];
    default:
      return [];
  }
}

export function committeeForRole(role?: Role | null): Committee | null {
  if (role === "COMMITTEE_ARCH") return "ARCHITECTURE";
  if (role === "COMMITTEE_SOCIAL") return "SOCIAL";
  return null;
}

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  HOA_GENERAL: "HOA Documents",
  BOARD: "Board Documents",
  COMMITTEE_ARCH: "Architecture Committee",
  COMMITTEE_SOCIAL: "Social Committee",
};
