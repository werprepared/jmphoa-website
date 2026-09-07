import "server-only";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export class AuthError extends Error {}

/** Current session's user, or null if not signed in. Does not check approval status. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws if not signed in, or signed in but not yet approved. */
export async function requireApprovedUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in.");
  if (user.status !== "APPROVED") throw new AuthError("Your account is not yet approved.");
  return user;
}

/** Throws unless the current user holds at least one of `roles`. Implies approved. */
export async function requireRole(...roles: Role[]) {
  const user = await requireApprovedUser();
  if (!(user.roles ?? []).some((r) => roles.includes(r))) {
    throw new AuthError("You do not have permission to do that.");
  }
  return user;
}
