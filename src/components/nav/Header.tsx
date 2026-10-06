import { auth } from "@/auth";
import { isTreasurer } from "@/lib/dues";
import SiteNav from "./SiteNav";

const ADMINISH_ROLES = ["ADMIN", "MEMBERSHIP_COORDINATOR", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL", "COMMITTEE_LANDSCAPE"];

export default async function Header() {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  // Only look up the Treasurer position when the roles alone wouldn't show the Admin link.
  const treasurer =
    session?.user?.status === "APPROVED" && !roles.some((r) => ADMINISH_ROLES.includes(r))
      ? await isTreasurer(session.user.id)
      : false;
  const user = session?.user
    ? { name: session.user.name ?? "Member", roles: session.user.roles, isTreasurer: treasurer }
    : null;
  return <SiteNav user={user} />;
}
