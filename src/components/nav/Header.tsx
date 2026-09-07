import { auth } from "@/auth";
import SiteNav from "./SiteNav";

export default async function Header() {
  const session = await auth();
  const user = session?.user ? { name: session.user.name ?? "Member", roles: session.user.roles } : null;
  return <SiteNav user={user} />;
}
